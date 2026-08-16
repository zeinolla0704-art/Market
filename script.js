/* =========================================================
   ALLIANZ MARKET — SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://pdhmhflnowpevyeboziv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_ocpLnuL_L0M6-WRbFsWMyg_DcggD5vD";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let currentUser = null;
let currentProfile = null;
let authMode = "register";


const $ = id => document.getElementById(id);


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);


async function init() {

    $("authButton").addEventListener(
        "click",
        handleAuth
    );

    $("authSwitch").addEventListener(
        "click",
        switchAuth
    );

    $("menuButton").addEventListener(
        "click",
        toggleMenu
    );

    $("addCarButton").addEventListener(
        "click",
        addCar
    );

    $("createGGButton").addEventListener(
        "click",
        createGGOrder
    );

    $("applyWorkerButton").addEventListener(
        "click",
        applyWorker
    );

    $("logoutButton").addEventListener(
        "click",
        logout
    );

    $("deleteAccountButton").addEventListener(
        "click",
        confirmDelete
    );

    $("confirmDeleteButton").addEventListener(
        "click",
        deleteAccount
    );

    $("closeDeleteButton").addEventListener(
        "click",
        closeDelete
    );


    document
        .querySelectorAll("[data-section]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => openSection(
                    button.dataset.section
                )
            );

        });


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error(error);
        }

        if (data && data.session) {
            await loadUser(data.session.user);
        }

    } catch (error) {

        console.error(
            "Ошибка запуска:",
            error
        );

    }


    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (
                session &&
                !currentUser
            ) {

                await loadUser(
                    session.user
                );

            }

        }
    );

}


/* =========================================================
   AUTH
   ========================================================= */

function switchAuth() {

    if (authMode === "register") {
        showLogin();
    } else {
        showRegister();
    }

}


function showLogin() {

    authMode = "login";

    $("authTitle").innerText =
        "Вход";

    $("authButton").innerText =
        "ВОЙТИ";

    $("authSwitch").innerText =
        "НАЗАД К РЕГИСТРАЦИИ";

    $("authTelegram").style.display =
        "none";

    $("authMessage").innerText =
        "";

}


function showRegister() {

    authMode = "register";

    $("authTitle").innerText =
        "Регистрация";

    $("authButton").innerText =
        "ЗАРЕГИСТРИРОВАТЬСЯ";

    $("authSwitch").innerText =
        "У МЕНЯ ЕСТЬ АККАУНТ";

    $("authTelegram").style.display =
        "block";

    $("authMessage").innerText =
        "";

}


async function handleAuth() {

    if (authMode === "register") {
        await register();
    } else {
        await login();
    }

}


/* =========================================================
   REGISTER
   ========================================================= */

function makeEmail(nick) {

    const normalized =
        nick
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9а-яё_-]/gi,
                "_"
            );

    return normalized +
        "@allianz-market.local";

}


async function register() {

    const nick =
        $("authNick").value.trim();

    const telegram =
        $("authTelegram").value.trim();

    const password =
        $("authPassword").value;

    const message =
        $("authMessage");


    message.style.color = "#ff4d4d";


    if (!nick || !telegram || !password) {

        message.innerText =
            "❌ Заполните все поля";

        return;

    }


    if (nick.length < 3) {

        message.innerText =
            "❌ Ник минимум 3 символа";

        return;

    }


    if (password.length < 6) {

        message.innerText =
            "❌ Пароль минимум 6 символов";

        return;

    }


    if (!telegram.startsWith("@")) {

        message.innerText =
            "❌ Telegram должен начинаться с @";

        return;

    }


    message.style.color = "#aaa";
    message.innerText = "⏳ Регистрация...";


    try {

        const email = makeEmail(nick);


        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email,
            password,

            options: {
                data: {
                    nick,
                    telegram
                }
            }

        });


        if (error) {
            throw error;
        }


        if (!data.user) {

            throw new Error(
                "Не удалось создать аккаунт"
            );

        }


        message.style.color =
            "#00d26a";

        message.innerText =
            "✅ Аккаунт создан!";


        $("authPassword").value = "";


        /*
         * Если в Supabase включено
         * подтверждение email, пользователь
         * может получить соответствующее
         * состояние регистрации.
         */

        if (!data.session) {

            message.innerText =
                "✅ Аккаунт создан. Теперь войдите.";

            setTimeout(
                showLogin,
                1200
            );

        }

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        message.style.color =
            "#ff4d4d";

        message.innerText =
            "❌ " +
            getErrorMessage(error);

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

    const nick =
        $("authNick").value.trim();

    const password =
        $("authPassword").value;

    const message =
        $("authMessage");


    if (!nick || !password) {

        message.style.color =
            "#ff4d4d";

        message.innerText =
            "❌ Введите ник и пароль";

        return;

    }


    message.style.color = "#aaa";
    message.innerText = "⏳ Вход...";


    try {

        const email =
            makeEmail(nick);


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email,
                password

            });


        if (error) {
            throw error;
        }


        await loadUser(
            data.user
        );

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        message.style.color =
            "#ff4d4d";

        message.innerText =
            "❌ Неверный ник или пароль";

    }

}


/* =========================================================
   LOAD USER
   ========================================================= */

async function loadUser(user) {

    currentUser = user;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        currentProfile = null;

    } else {

        currentProfile = data;

    }


    if (
        currentProfile &&
        currentProfile.blocked
    ) {

        await supabaseClient.auth.signOut();

        currentUser = null;
        currentProfile = null;

        alert(
            "🚫 Ваш аккаунт заблокирован"
        );

        return;

    }


    $("authPage")
        .classList
        .add("hidden");

    $("mainPage")
        .classList
        .remove("hidden");


    renderProfile();

    await renderCars();
    await renderUsers();
    await renderGGOrders();

    updateAdminMenu();

    openSection("home");

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error(error);
    }


    currentUser = null;
    currentProfile = null;


    $("mainPage")
        .classList
        .add("hidden");

    $("authPage")
        .classList
        .remove("hidden");


    $("authNick").value = "";
    $("authTelegram").value = "";
    $("authPassword").value = "";

    showLogin();

}


/* =========================================================
   MENU
   ========================================================= */

function toggleMenu() {

    const menu = $("menu");

    menu.style.display =
        menu.style.display === "block"
            ? "none"
            : "block";

}


function openSection(id) {

    document
        .querySelectorAll(".content")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

        });


    const section = $(id);

    if (!section) {
        return;
    }


    section.classList.add("active");


    $("menu").style.display =
        "none";


    if (id === "market") {
        renderCars();
    }

    if (id === "users") {
        renderUsers();
    }

    if (id === "profile") {
        renderProfile();
    }

    if (id === "gg") {
        renderGGOrders();
    }

    if (id === "admin") {
        renderAdmin();
    }

}


/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile() {

    if (!currentProfile) {

        $("myProfile").innerHTML = `
            <div class="empty">
                Профиль ещё не создан.
            </div>
        `;

        return;

    }


    $("myProfile").innerHTML = `

        <div class="profileCard">

            <div class="avatar">
                👤
            </div>

            <h2>
                ${safe(currentProfile.nick)}
            </h2>

            <p>
                💬 Telegram:
                ${safe(currentProfile.telegram)}
            </p>

            <p>
                🛡️ Роль:
                <span class="role">
                    ${safe(
                        roleName(
                            currentProfile.role
                        )
                    )}
                </span>
            </p>

            ${
                currentProfile.worker
                    ? "<p>👷 Работник GG</p>"
                    : ""
            }

        </div>
    `;

}


/* =========================================================
   CARS
   ========================================================= */

async function addCar() {

    if (!currentUser) {
        alert("❌ Сначала войдите в аккаунт");
        return;
    }


    const name =
        $("carName").value.trim();

    const photo =
        $("carPhoto").value.trim();

    const description =
        $("carDescription").value.trim();

    const stats =
        $("carStats").value.trim();

    const price =
        $("carPrice").value.trim();


    if (!name || !description || !price) {

        alert(
            "❌ Заполните название, описание и цену"
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("cars")
            .insert({

                owner_id: currentUser.id,
                name,
                photo,
                description,
                stats,
                price

            });


    if (error) {

        console.error(error);

        alert(
            "❌ Ошибка публикации: " +
            error.message
        );

        return;

    }


    $("carName").value = "";
    $("carPhoto").value = "";
    $("carDescription").value = "";
    $("carStats").value = "";
    $("carPrice").value = "";


    alert(
        "✅ Объявление опубликовано!"
    );


    await renderCars();
    openSection("market");

}


async function renderCars() {

    const list = $("carList");

    if (!list) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("cars")
            .select(`
                *,
                profiles (
                    nick,
                    telegram
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML = `
            <div class="empty">
                ❌ Не удалось загрузить объявления
            </div>
        `;

        return;

    }


    if (!data || !data.length) {

        list.innerHTML = `
            <div class="empty">
                Пока нет объявлений 🚗
            </div>
        `;

        return;

    }


    list.innerHTML =
        data.map(car => {

            const photo =
                car.photo
                    ? `
                        <img
                            src="${safeAttr(car.photo)}"
                            alt="Машина"
                        >
                    `
                    : "";


            return `

                <div class="carCard">

                    ${photo}

                    <h2>
                        ${safe(car.name)}
                    </h2>

                    <p class="carDescription">
                        ${safe(car.description)}
                    </p>

                    ${
                        car.stats
                            ? `
                                <p>
                                    ⚙️
                                    ${safe(car.stats)}
                                </p>
                            `
                            : ""
                    }

                    <div class="price">
                        💰 ${safe(car.price)}
                    </div>

                    <button
                        type="button"
                        onclick="openUserProfile('${safeJS(
                            car.owner_id
                        )}')">

                        👤 Продавец:
                        ${safe(
                            car.profiles?.nick ||
                            "Пользователь"
                        )}

                    </button>

                    ${
                        canDeleteCar(car)
                            ? `
                                <button
                                    type="button"
                                    class="danger"
                                    onclick="deleteCar('${safeJS(
                                        car.id
                                    )}')">

                                    🗑️ Удалить

                                </button>
                            `
                            : ""
                    }

                </div>
            `;

        }).join("");

}


async function deleteCar(id) {

    if (!confirm(
        "Удалить это объявление?"
    )) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("cars")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    await renderCars();

}


function canDeleteCar(car) {

    if (!currentUser || !currentProfile) {
        return false;
    }


    return (
        car.owner_id === currentUser.id ||
        isAdmin()
    );

}


/* =========================================================
   USERS
   ========================================================= */

async function renderUsers() {

    const list = $("userList");

    if (!list) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id,nick,telegram,role,worker,blocked"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        list.innerHTML = `
            <div class="empty">
                ❌ Ошибка загрузки пользователей
            </div>
        `;

        return;

    }


    if (!data || !data.length) {

        list.innerHTML = `
            <div class="empty">
                Пользователей пока нет.
            </div>
        `;

        return;

    }


    list.innerHTML =
        data.map(user => `

            <div class="userCard">

                <div class="avatar">
                    👤
                </div>

                <div class="userInfo">

                    <strong>
                        ${safe(user.nick)}
                    </strong>

                    <p>
                        ${safe(
                            roleName(user.role)
                        )}
                    </p>

                </div>

                <button
                    type="button"
                    onclick="openUserProfile('${safeJS(
                        user.id
                    )}')">

                    ОТКРЫТЬ

                </button>

            </div>

        `).join("");

}


/* =========================================================
   PUBLIC PROFILE
   ========================================================= */

async function openUserProfile(id) {

    const {
        data: user,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !user) {

        alert(
            "Пользователь не найден"
        );

        return;

    }


    const {
        data: cars
    } =
        await supabaseClient
            .from("cars")
            .select("*")
            .eq("owner_id", id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    const telegram =
        String(user.telegram || "")
            .replace(/^@/, "");


    const carsHTML =
        cars && cars.length
            ? cars.map(car => `

                <div class="homeCard">

                    <h3>
                        ${safe(car.name)}
                    </h3>

                    <p>
                        ${safe(car.description)}
                    </p>

                    <div class="price">
                        💰 ${safe(car.price)}
                    </div>

                </div>

            `).join("")
            : `
                <div class="empty">
                    Объявлений пока нет.
                </div>
            `;


    $("publicProfileBox").innerHTML = `

        <div class="profileCard">

            <div class="avatar">
                👤
            </div>

            <h1>
                ${safe(user.nick)}
            </h1>

            <p>
                💬 ${safe(user.telegram)}
            </p>

            <p>
                🛡️
                <span class="role">
                    ${safe(
                        roleName(user.role)
                    )}
                </span>
            </p>

            ${
                user.worker
                    ? "<p>👷 Работник GG</p>"
                    : ""
            }

            <a
                href="https://t.me/${encodeURIComponent(
                    telegram
                )}"
                target="_blank"
                rel="noopener noreferrer">

                <button type="button">
                    💬 НАПИСАТЬ В TELEGRAM
                </button>

            </a>

        </div>

        <h2>🚗 Объявления</h2>

        ${carsHTML}
    `;


    openSection("publicProfile");

}


/* =========================================================
   GG ORDERS
   ========================================================= */

async function createGGOrder() {

    if (!currentUser) {
        alert("❌ Сначала войдите");
        return;
    }


    const title =
        $("ggTitle").value.trim();

    const description =
        $("ggDescription").value.trim();


    if (!title || !description) {

        alert(
            "❌ Заполните услугу и описание"
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("gg_orders")
            .insert({

                client_id: currentUser.id,
                title,
                description,
                status: "new"

            });


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    $("ggTitle").value = "";
    $("ggDescription").value = "";


    alert(
        "✅ Заказ создан!"
    );


    await renderGGOrders();

}


async function renderGGOrders() {

    const box = $("ggOrders");

    if (!box) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("gg_orders")
            .select(`
                *,
                client:profiles!gg_orders_client_id_fkey(
                    nick,
                    telegram
                ),
                worker:profiles!gg_orders_worker_id_fkey(
                    nick,
                    telegram
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        box.innerHTML = `
            <div class="empty">
                ❌ Ошибка загрузки GG-заказов
            </div>
        `;

        return;

    }


    if (!data || !data.length) {

        box.innerHTML = `
            <div class="empty">
                Заказов пока нет 🛠️
            </div>
        `;

        return;

    }


    box.innerHTML =
        data.map(order => {

            const canTake =
                isWorker() &&
                !order.worker_id &&
                order.client_id !==
                    currentUser.id;


            return `

                <div class="orderCard">

                    <h2>
                        🛠️ ${safe(order.title)}
                    </h2>

                    <p>
                        ${safe(order.description)}
                    </p>

                    <p>
                        👤 Клиент:
                        ${safe(
                            order.client?.nick || "—"
                        )}
                    </p>

                    <p>
                        📌 Статус:
                        ${safe(
                            orderStatus(order.status)
                        )}
                    </p>

                    ${
                        order.worker_id
                            ? `
                                <p>
                                    👷 Работник:
                                    ${safe(
                                        order.worker?.nick || "—"
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        order.price
                            ? `
                                <p class="price">
                                    💰 ${safe(order.price)}
                                </p>
                            `
                            : ""
                    }

                    ${
                        canTake
                            ? `
                                <button
                                    type="button"
                                    onclick="takeOrder('${safeJS(
                                        order.id
                                    )}')">

                                    👷 ВЗЯТЬ ЗАКАЗ

                                </button>
                            `
                            : ""
                    }

                </div>
            `;

        }).join("");

}


async function takeOrder(id) {

    if (!isWorker()) {

        alert(
            "❌ Вы не являетесь работником GG"
        );

        return;

    }


    const price =
        prompt(
            "Введите цену услуги:"
        );


    if (!price) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("gg_orders")
            .update({

                worker_id: currentUser.id,
                price,
                status: "worker_assigned"

            })
            .eq("id", id)
            .is("worker_id", null);


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    await renderGGOrders();

}


/* =========================================================
   WORKER
   ========================================================= */

async function applyWorker() {

    if (!currentUser) {
        return;
    }


    const reason =
        $("workerReason").value.trim();

    const service =
        $("workerService").value.trim();


    if (!reason || !service) {

        alert(
            "❌ Заполните оба поля"
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("worker_applications")
            .insert({

                user_id: currentUser.id,
                reason,
                service,
                status: "pending"

            });


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    $("workerReason").value = "";
    $("workerService").value = "";

    $("workerMessage").style.color =
        "#00d26a";

    $("workerMessage").innerText =
        "✅ Заявка отправлена владельцу/администратору.";

}


/* =========================================================
   ROLES
   ========================================================= */

function isOwner() {

    return !!(
        currentProfile &&
        currentProfile.role === "owner"
    );

}


function isAdmin() {

    return !!(
        currentProfile &&
        (
            currentProfile.role === "owner" ||
            currentProfile.role === "admin"
        )
    );

}


function isWorker() {

    return !!(
        currentProfile &&
        (
            currentProfile.worker === true ||
            currentProfile.role === "worker" ||
            isAdmin()
        )
    );

}


function roleName(role) {

    const roles = {

        user: "Пользователь",
        worker: "Работник GG",
        admin: "Администратор",
        owner: "Владелец"

    };

    return roles[role] ||
        "Пользователь";

}


function orderStatus(status) {

    const statuses = {

        new: "Новый",
        worker_assigned: "Работник назначен",
        completed: "Завершён",
        cancelled: "Отменён"

    };

    return statuses[status] ||
        status ||
        "Неизвестно";

}


/* =========================================================
   ADMIN
   ========================================================= */

function updateAdminMenu() {

    const button =
        $("adminMenuButton");

    if (!button) {
        return;
    }


    button.style.display =
        isAdmin()
            ? "block"
            : "none";

}


async function renderAdmin() {

    if (!isAdmin()) {

        alert(
            "❌ Нет доступа"
        );

        openSection("home");

        return;

    }


    const list =
        $("adminList");

    if (!list) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        list.innerHTML = `
            <div class="empty">
                ❌ ${safe(error.message)}
            </div>
        `;

        return;

    }


    list.innerHTML =
        data.map(user => {

            const canEdit =
                isOwner() &&
                user.id !== currentUser.id;


            return `

                <div class="adminUser">

                    <strong>
                        👤 ${safe(user.nick)}
                    </strong>

                    <span class="role">
                        ${safe(
                            roleName(user.role)
                        )}
                    </span>

                    <span>
                        💬 ${safe(user.telegram)}
                    </span>

                    ${
                        user.worker
                            ? "<span>👷 Работник GG</span>"
                            : ""
                    }

                    ${
                        user.blocked
                            ? "<span>🚫 Заблокирован</span>"
                            : ""
                    }

                    ${
                        canEdit
                            ? `
                                <div class="adminActions">

                                    <button
                                        type="button"
                                        onclick="changeRole(
                                            '${safeJS(user.id)}',
                                            'admin'
                                        )">
                                        🛡️ Админ
                                    </button>

                                    <button
                                        type="button"
                                        onclick="changeRole(
                                            '${safeJS(user.id)}',
                                            'worker'
                                        )">
                                        👷 Worker
                                    </button>

                                    <button
                                        type="button"
                                        onclick="changeRole(
                                            '${safeJS(user.id)}',
                                            'user'
                                        )">
                                        👤 User
                                    </button>

                                    <button
                                        type="button"
                                        class="danger"
                                        onclick="toggleBlock(
                                            '${safeJS(user.id)}',
                                            ${!user.blocked}
                                        )">
                                        ${
                                            user.blocked
                                                ? "🔓 Разблокировать"
                                                : "🚫 Заблокировать"
                                        }
                                    </button>

                                </div>
                            `
                            : ""
                    }

                </div>
            `;

        }).join("");

}


async function changeRole(
    userId,
    role
) {

    if (!isOwner()) {

        alert(
            "❌ Только владелец может менять роли"
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({ role })
            .eq("id", userId);


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    await renderAdmin();
    await renderUsers();

}


async function toggleBlock(
    userId,
    blocked
) {

    if (!isOwner()) {

        alert(
            "❌ Только владелец может блокировать"
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({ blocked })
            .eq("id", userId);


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    await renderAdmin();

}


/* =========================================================
   DELETE PROFILE
   ========================================================= */

function confirmDelete() {

    $("deleteModal")
        .classList
        .add("show");

}


function closeDelete() {

    $("deleteModal")
        .classList
        .remove("show");

}


async function deleteAccount() {

    if (!currentUser) {
        return;
    }


    if (!confirm(
        "Точно удалить аккаунт?"
    )) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .delete()
            .eq("id", currentUser.id);


    if (error) {

        alert(
            "❌ " +
            error.message
        );

        return;

    }


    closeDelete();

    await logout();

}


/* =========================================================
   ERRORS
   ========================================================= */

function getErrorMessage(error) {

    const msg =
        String(
            error?.message ||
            error ||
            ""
        );


    const lower =
        msg.toLowerCase();


    if (
        lower.includes(
            "already registered"
        )
    ) {
        return "Этот аккаунт уже зарегистрирован";
    }


    if (
        lower.includes(
            "password"
        )
    ) {
        return "Пароль должен содержать минимум 6 символов";
    }


    if (
        lower.includes(
            "email"
        )
    ) {
        return "Ошибка данных аккаунта";
    }


    return msg ||
        "Неизвестная ошибка";

}


/* =========================================================
   SECURITY
   ========================================================= */

function safe(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function safeAttr(value) {

    return safe(value);

}


function safeJS(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        );

}
