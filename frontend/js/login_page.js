const API_URL =
    window.location.hostname
    === "localhost"

        ? "http://localhost:3000"

        : "https://habittracker-6e80.onrender.com";

var AppState = {
    loginMode: true
};

const DOM = {
    login_form: document.getElementById('login_form'),
    input_username: document.getElementById('input_username'),
    input_password: document.getElementById('input_password'),
    input_confirm_password: document.getElementById('input_confirm_password'),
    warning_text: document.getElementById('warning_text'),
    toggle_login_logon: document.getElementById('toggle_login_logon'),
    button_submit: document.getElementById('button_submit')
}

DOM.toggle_login_logon.innerHTML = `Don't have an account yet? Sign up by clicking here.`;
DOM.button_submit.innerHTML = 'Login';

DOM.toggle_login_logon.addEventListener('click', () => {
    AppState.loginMode = !AppState.loginMode;
    DOM.input_confirm_password.style.display = AppState.loginMode ? 'none' : 'block';
    DOM.input_confirm_password.value = '';
    DOM.toggle_login_logon.innerHTML = AppState.loginMode ? `Don't have an account yet? Sign up by clicking here.` : `Click here to go back to sign in`;
    DOM.button_submit.innerHTML = AppState.loginMode ? 'Login' : 'Sign Up';
    DOM.warning_text.style.display = 'none';
})

DOM.button_submit.addEventListener('click', (event) => {
    event.preventDefault();
    AppState.loginMode ? login() : signup();
})

async function checkLoggedUser(){
    const token = localStorage.getItem("token");
    if(!token) return;
    try {
        const response = await fetch(
            `${API_URL}/auth/checkLoggedUser`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        if (response.ok) {
            window.location.href = "./homePage.html";
        }
    } catch (error) {
        alert(error);
    }
}

function mostrarErro(errorMessage){
    DOM.warning_text.innerHTML = errorMessage;
    DOM.warning_text.style.display = 'block';
}

async function login() {
    if (!DOM.input_username.value || !DOM.input_password.value) {
        mostrarErro("All fields are required");
        return;
    }
    const userData = {
        username: DOM.input_username.value,
        password: DOM.input_password.value
    };
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status < 500) {
                mostrarErro(data.error);
                return;
            }
            throw new Error(data.error);
            return;
        }
        localStorage.setItem("token", data.token);
        window.location.href = "./homePage.html";
    } catch (error) {
        alert(error);
    }
}

async function signup() {
    if (!DOM.input_username.value || !DOM.input_password.value || !DOM.input_confirm_password.value) {
        mostrarErro("All fields are required");
        return;
    }
    if (DOM.input_password.value !== DOM.input_confirm_password.value) {
        mostrarErro("Passwords don't match");
        return;
    }
    const userData = {
        username: DOM.input_username.value,
        password: DOM.input_password.value,
        confirmPassword: DOM.input_confirm_password.value
    };
    try {
        const response = await fetch(
            `${API_URL}/auth/signup`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            }
        );
        const data = await response.json();
        if (!response.ok) {
            if (response.status < 500) {
                mostrarErro(data.error);
                return;
            }
            throw new Error(data.error);
            return;
        }
        login();
    } catch (error) {
        alert(error);
    }
}

checkLoggedUser();