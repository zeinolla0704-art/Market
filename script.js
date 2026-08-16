/* Allianz Market
   Custom account system: nick + username + password.
   No email / SMS / Supabase Auth.
   The SQL for the RPC functions used below comes in schema.sql.
*/
const SUPABASE_URL="https://pdhmhflnowpevyeboziv.supabase.co";
const SUPABASE_KEY="sb_publishable_ocpLnuL_L0M6-WRbFsWMyg_DcggD5vDcg";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
let currentUser=null,currentProfile=null,authMode="register";
let token=localStorage.getItem("allianz_session")||"";

document.addEventListener("DOMContentLoaded",init);

async function init(){
  $("authButton").onclick=handleAuth;
  $("authSwitch").onclick=switchAuth;
  $("menuButton").onclick=toggleMenu;
  $("addCarButton").onclick=addCar;
  $("createGGButton").onclick=createGGOrder;
  $("applyWorkerButton").onclick=applyWorker;
  $("logoutButton").onclick=logout;
  $("deleteAccountButton").onclick=confirmDelete;
  $("confirmDeleteButton").onclick=deleteAccount;
  $("closeDeleteButton").onclick=closeDelete;
  document.querySelectorAll("[data-section]").forEach(b=>b.onclick=()=>openSection(b.dataset.section));
  if(token) await restoreSession();
}

function switchAuth(){authMode==="register"?showLogin():showRegister()}
function showLogin(){
  authMode="login";$("authTitle").textContent="Вход";$("authButton").textContent="ВОЙТИ";
  $("authSwitch").textContent="НАЗАД К РЕГИСТРАЦИИ";$("telegramLabel").style.display="none";
  $("authTelegram").style.display="none";$("authMessage").textContent="";
}
function showRegister(){
  authMode="register";$("authTitle").textContent="Регистрация";$("authButton").textContent="ЗАРЕГИСТРИРОВАТЬСЯ";
  $("authSwitch").textContent="У МЕНЯ ЕСТЬ АККАУНТ";$("telegramLabel").style.display="block";
  $("authTelegram").style.display="block";$("authMessage").textContent="";
}
async function handleAuth(){authMode==="register"?await register():await login()}

async function register(){
  const nick=$("authNick").value.trim(),username=$("authUsername").value.trim().toLowerCase(),password=$("authPassword").value,telegram=$("authTelegram").value.trim(),m=$("authMessage");
  if(!nick||!username||!password||!telegram){m.textContent="❌ Заполните все поля";return}
  if(nick.length<3){m.textContent="❌ Ник минимум 3 символа";return}
  if(!/^[a-z0-9_]{3,24}$/.test(username)){m.textContent="❌ Юзер: 3–24 символа, только a-z, 0-9 и _";return}
  if(password.length<6){m.textContent="❌ Пароль минимум 6 символов";return}
  if(!telegram.startsWith("@")){m.textContent="❌ Telegram должен начинаться с @";return}
  m.textContent="⏳ Регистрация...";
  try{
    const {data,error}=await db.rpc("register_user",{p_nick:nick,p_username:username,p_password:password,p_telegram:telegram});
    if(error)throw error;if(!data?.token)throw new Error("Регистрация не выполнена");
    token=data.token;localStorage.setItem("allianz_session",token);await restoreSession();
  }catch(e){console.error(e);m.textContent="❌ "+friendly(e)}
}

async function login(){
  const username=$("authUsername").value.trim().toLowerCase(),password=$("authPassword").value,m=$("authMessage");
  if(!username||!password){m.textContent="❌ Введите юзер и пароль";return}
  m.textContent="⏳ Вход...";
  try{
    const {data,error}=await db.rpc("login_user",{p_username:username,p_password:password});
    if(error)throw error;if(!data?.token)throw new Error("Неверный юзер или пароль");
    token=data.token;localStorage.setItem("allianz_session",token);await restoreSession();
  }catch(e){console.error(e);m.textContent="❌ "+friendly(e)}
}

async function restoreSession(){
  try{
    const {data,error}=await db.rpc("get_me",{p_token:token});
    if(error||!data?.user){localStorage.removeItem("allianz_session");token="";showLogin();return}
    currentUser=data.user;currentProfile=data.user;
    $("authPage").classList.add("hidden");$("mainPage").classList.remove("hidden");
    renderProfile();await Promise.all([renderCars(),renderUsers(),renderGGOrders()]);updateAdminMenu();openSection("home");
  }catch(e){console.error(e)}
}

async function logout(){
  if(token)await db.rpc("logout_user",{p_token:token});
  token="";localStorage.removeItem("allianz_session");currentUser=null;currentProfile=null;
  $("mainPage").classList.add("hidden");$("authPage").classList.remove("hidden");
  $("authPassword").value="";showLogin();
}

function toggleMenu(){const m=$("menu");m.style.display=m.style.display==="block"?"none":"block"}
function openSection(id){
  document.querySelectorAll(".content").forEach(x=>x.classList.remove("active"));
  const s=$(id);if(!s)return;s.classList.add("active");$("menu").style.display="none";
  if(id==="market")renderCars();if(id==="users")renderUsers();if(id==="profile")renderProfile();
  if(id==="gg")renderGGOrders();if(id==="admin")renderAdmin();
}

function renderProfile(){
  if(!currentProfile)return;
  $("myProfile").innerHTML=`<div class="profileCard"><div class="avatar">👤</div>
  <h2>${safe(currentProfile.nick)}</h2><p>👤 Юзер: ${safe(currentProfile.username)}</p>
  <p>💬 Telegram: ${safe(currentProfile.telegram)}</p><p>🛡️ Роль: <span class="role">${safe(roleName(currentProfile.role))}</span></p>
  ${currentProfile.worker?"<p>👷 Работник GG</p>":""}</div>`;
}

async function addCar(){
  const name=$("carName").value.trim(),photo=$("carPhoto").value.trim(),description=$("carDescription").value.trim(),stats=$("carStats").value.trim(),price=$("carPrice").value.trim();
  if(!name||!description||!price){alert("❌ Заполните название, описание и цену");return}
  const {data,error}=await db.rpc("create_car",{p_token:token,p_name:name,p_photo:photo,p_description:description,p_stats:stats,p_price:price});
  if(error||!data?.ok){alert("❌ "+friendly(error||data));return}
  ["carName","carPhoto","carDescription","carStats","carPrice"].forEach(id=>$(id).value="");alert("✅ Объявление опубликовано!");renderCars();
}
async function renderCars(){
  const list=$("carList");if(!list)return;
  const {data,error}=await db.rpc("list_cars");
  if(error){list.innerHTML=`<div class="empty">❌ ${safe(friendly(error))}</div>`;return}
  if(!data?.length){list.innerHTML='<div class="empty">Пока нет объявлений 🚗</div>';return}
  list.innerHTML=data.map(c=>`<div class="carCard">${c.photo?`<img src="${safeAttr(c.photo)}" alt="Машина">`:""}
  <h2>${safe(c.name)}</h2><p class="carDescription">${safe(c.description)}</p>${c.stats?`<p>⚙️ ${safe(c.stats)}</p>`:""}
  <div class="price">💰 ${safe(c.price)}</div><button onclick="openUserProfile('${safeJS(c.owner_id)}')">👤 Продавец: ${safe(c.owner_nick||"Пользователь")}</button>
  ${(c.owner_id===currentUser.id||isAdmin())?`<button class="danger" onclick="deleteCar('${safeJS(c.id)}')">🗑️ Удалить</button>`:""}</div>`).join("");
}
async function deleteCar(id){if(!confirm("Удалить это объявление?"))return;const {data,error}=await db.rpc("delete_car",{p_token:token,p_car_id:id});if(error||!data?.ok)alert("❌ "+friendly(error||data));else renderCars()}

async function renderUsers(){
  const list=$("userList");if(!list)return;const {data,error}=await db.rpc("list_users");
  if(error){list.innerHTML='<div class="empty">❌ Ошибка загрузки пользователей</div>';return}
  list.innerHTML=data?.length?data.map(u=>`<div class="userCard"><div class="avatar">👤</div><div class="userInfo"><strong>${safe(u.nick)}</strong><p>${safe(roleName(u.role))}</p></div><button onclick="openUserProfile('${safeJS(u.id)}')">ОТКРЫТЬ</button></div>`).join(""):'<div class="empty">Пользователей пока нет.</div>';
}
async function openUserProfile(id){
  const {data,error}=await db.rpc("get_public_profile",{p_user_id:id});if(error||!data?.profile){alert("Пользователь не найден");return}
  const u=data.profile,cars=data.cars||[],tg=String(u.telegram||"").replace(/^@/,"");
  $("publicProfileBox").innerHTML=`<div class="profileCard"><div class="avatar">👤</div><h1>${safe(u.nick)}</h1><p>👤 ${safe(u.username)}</p><p>💬 ${safe(u.telegram)}</p><p>🛡️ <span class="role">${safe(roleName(u.role))}</span></p>
  ${u.worker?"<p>👷 Работник GG</p>":""}<a href="https://t.me/${encodeURIComponent(tg)}" target="_blank" rel="noopener"><button>💬 НАПИСАТЬ В TELEGRAM</button></a></div>
  <h2>🚗 Объявления</h2>${cars.length?cars.map(c=>`<div class="homeCard"><h3>${safe(c.name)}</h3><p>${safe(c.description)}</p><div class="price">💰 ${safe(c.price)}</div></div>`).join(""):'<div class="empty">Объявлений пока нет.</div>'}`;
  openSection("publicProfile");
}

async function createGGOrder(){
  const title=$("ggTitle").value.trim(),description=$("ggDescription").value.trim();if(!title||!description){alert("❌ Заполните поля");return}
  const {data,error}=await db.rpc("create_gg_order",{p_token:token,p_title:title,p_description:description});
  if(error||!data?.ok){alert("❌ "+friendly(error||data));return}$("ggTitle").value="";$("ggDescription").value="";alert("✅ Заказ создан!");renderGGOrders();
}
async function renderGGOrders(){
  const box=$("ggOrders");if(!box)return;const {data,error}=await db.rpc("list_gg_orders",{p_token:token});
  if(error){box.innerHTML='<div class="empty">❌ Ошибка загрузки GG-заказов</div>';return}
  if(!data?.length){box.innerHTML='<div class="empty">Заказов пока нет 🛠️</div>';return}
  box.innerHTML=data.map(o=>`<div class="orderCard"><h2>🛠️ ${safe(o.title)}</h2><p>${safe(o.description)}</p><p>👤 Клиент: ${safe(o.client_nick||"—")}</p><p>📌 Статус: ${safe(orderStatus(o.status))}</p>${o.worker_id?`<p>👷 Работник: ${safe(o.worker_nick||"—")}</p>`:""}${o.price?`<p class="price">💰 ${safe(o.price)}</p>`:""}${isWorker()&&!o.worker_id&&o.client_id!==currentUser.id?`<button onclick="takeOrder('${safeJS(o.id)}')">👷 ВЗЯТЬ ЗАКАЗ</button>`:""}</div>`).join("");
}
async function takeOrder(id){
  if(!isWorker()){alert("❌ Вы не работник GG");return}const price=prompt("Введите цену услуги:");if(!price)return;
  const {data,error}=await db.rpc("take_gg_order",{p_token:token,p_order_id:id,p_price:price});if(error||!data?.ok)alert("❌ "+friendly(error||data));else renderGGOrders();
}
async function applyWorker(){
  const reason=$("workerReason").value.trim(),service=$("workerService").value.trim();if(!reason||!service){alert("❌ Заполните оба поля");return}
  const {data,error}=await db.rpc("apply_worker",{p_token:token,p_reason:reason,p_service:service});if(error||!data?.ok){alert("❌ "+friendly(error||data));return}
  $("workerReason").value="";$("workerService").value="";$("workerMessage").textContent="✅ Заявка отправлена.";
}
function isOwner(){return currentProfile?.role==="owner"}function isAdmin(){return ["owner","admin"].includes(currentProfile?.role)}function isWorker(){return currentProfile&&(currentProfile.worker||["worker","admin","owner"].includes(currentProfile.role))}
function roleName(r){return({user:"Пользователь",worker:"Работник GG",admin:"Администратор",owner:"Владелец"})[r]||"Пользователь"}
function orderStatus(s){return({new:"Новый",worker_assigned:"Работник назначен",completed:"Завершён",cancelled:"Отменён"})[s]||s||"Неизвестно"}
function updateAdminMenu(){$("adminMenuButton").classList.toggle("hidden",!isAdmin())}
async function renderAdmin(){
  if(!isAdmin()){alert("❌ Нет доступа");return openSection("home")}const list=$("adminList");if(!list)return;
  const {data,error}=await db.rpc("admin_list_users",{p_token:token});if(error){list.innerHTML=`<div class="empty">❌ ${safe(friendly(error))}</div>`;return}
  list.innerHTML=(data||[]).map(u=>`<div class="adminUser"><strong>👤 ${safe(u.nick)}</strong><span class="role">${safe(roleName(u.role))}</span><span>💬 ${safe(u.telegram)}</span>${u.blocked?"<span>🚫 Заблокирован</span>":""}${isOwner()&&u.id!==currentUser.id?`<div class="adminActions"><button onclick="changeRole('${safeJS(u.id)}','admin')">🛡️ Админ</button><button onclick="changeRole('${safeJS(u.id)}','worker')">👷 Worker</button><button onclick="changeRole('${safeJS(u.id)}','user')">👤 User</button><button class="danger" onclick="toggleBlock('${safeJS(u.id)}',${!u.blocked})">${u.blocked?"🔓 Разблокировать":"🚫 Заблокировать"}</button></div>`:""}</div>`).join("");
}
async function changeRole(id,role){const {data,error}=await db.rpc("admin_change_role",{p_token:token,p_user_id:id,p_role:role});if(error||!data?.ok)alert("❌ "+friendly(error||data));else{renderAdmin();renderUsers()}}
async function toggleBlock(id,blocked){const {data,error}=await db.rpc("admin_toggle_block",{p_token:token,p_user_id:id,p_blocked:blocked});if(error||!data?.ok)alert("❌ "+friendly(error||data));else renderAdmin()}
function confirmDelete(){$("deleteModal").classList.add("show")}function closeDelete(){$("deleteModal").classList.remove("show")}
async function deleteAccount(){if(!confirm("Точно удалить аккаунт?"))return;const {data,error}=await db.rpc("delete_account",{p_token:token});if(error||!data?.ok){alert("❌ "+friendly(error||data));return}closeDelete();logout()}
function friendly(e){const s=String(e?.message||e?.error||e||"Неизвестная ошибка");if(/already|duplicate/i.test(s))return"Такой юзер уже существует";if(/invalid|password|credentials/i.test(s))return"Неверный юзер или пароль";return s}
function safe(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function safeAttr(v){return safe(v)}function safeJS(v){return String(v??"").replaceAll("\\","\\\\").replaceAll("'","\\'")}
