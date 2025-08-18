/*document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const verifyForm = document.getElementById('verifyForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
    const toggleText = document.getElementById('toggleText');
    const usernameContainer = document.getElementById('usernameContainer');
    const confirmPasswordContainer = document.getElementById('confirmPasswordContainer');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const verificationCodeInput = document.getElementById('verificationCode');

    // Clear sensitive query parameters
    if (window.location.search.includes('email') || window.location.search.includes('password')) {
        console.warn('Sensitive data detected in URL, redirecting to clean URL');
        window.location.href = 'login.html';
        return;
    }

    let isLoginMode = true;
    let pendingUserId = null;

    function toggleMode() {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            formTitle.textContent = 'Login';
            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account?";
            toggleAuthModeBtn.textContent = 'Sign Up';
            usernameContainer.style.display = 'none';
            confirmPasswordContainer.style.display = 'none';
            usernameInput.required = false;
            confirmPasswordInput.required = false;
            authForm.classList.remove('hidden');
            verifyForm.classList.add('hidden');
        } else {
            formTitle.textContent = 'Sign Up';
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleAuthModeBtn.textContent = 'Login';
            usernameContainer.style.display = 'block';
            confirmPasswordContainer.style.display = 'block';
            usernameInput.required = true;
            confirmPasswordInput.required = true;
            authForm.classList.remove('hidden');
            verifyForm.classList.add('hidden');
        }
        authForm.reset();
        verifyForm.reset();
    }

    function showVerificationForm() {
        formTitle.textContent = 'Verify Email';
        authForm.classList.add('hidden');
        verifyForm.classList.remove('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleAuthModeBtn.textContent = 'Login';
    }

    toggleAuthModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMode();
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const username = usernameInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!isLoginMode && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        let url = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
        let body = isLoginMode ? { email, password } : { username, email, password };

        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? 'Logging in...' : 'Signing up...';

        try {
            console.log(`Sending ${isLoginMode ? 'login' : 'signup'} request to ${url}`);
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            console.log('Server response:', data);

            if (res.ok) {
                if (isLoginMode) {
                    if (data.user && data.user.id && data.user.username && data.user.email) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.href = 'chat.html';
                    } else {
                        console.error('Invalid user data in login response:', data);
                        alert('Login failed: Invalid user data from server');
                    }
                } else {
                    pendingUserId = data.userId;
                    showVerificationForm();
                }
            } else {
                alert(data.msg || 'An error occurred');
            }
        } catch (error) {
            console.error('Network error during authentication:', error);
            alert('Network error or server unavailable');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Login' : 'Sign Up';
        }
    });

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = verificationCodeInput.value.trim();

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: pendingUserId, code })
            });

            const data = await res.json();
            console.log('Verification response:', data);

            if (res.ok) {
                alert('Email verified successfully! Please log in.');
                toggleMode();
            } else {
                alert(data.msg || 'An error occurred during verification');
            }
        } catch (error) {
            console.error('Network error during verification:', error);
            alert('Network error or server unavailable');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify';
        }
    });
});*/

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const verifyForm = document.getElementById('verifyForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
    const toggleText = document.getElementById('toggleText');
    const usernameContainer = document.getElementById('usernameContainer');
    const confirmPasswordContainer = document.getElementById('confirmPasswordContainer');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const verificationCodeInput = document.getElementById('verificationCode');

    if (window.location.search.includes('email') || window.location.search.includes('password')) {
        console.warn('Sensitive data detected in URL, redirecting to clean URL');
        window.location.href = 'login.html';
        return;
    }

    let isLoginMode = true;
    let pendingEmail = null;

    function toggleMode() {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            formTitle.textContent = 'Login';
            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account?";
            toggleAuthModeBtn.textContent = 'Sign Up';
            usernameContainer.style.display = 'none';
            confirmPasswordContainer.style.display = 'none';
            usernameInput.required = false;
            confirmPasswordInput.required = false;
            authForm.classList.remove('hidden');
            verifyForm.classList.add('hidden');
        } else {
            formTitle.textContent = 'Sign Up';
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleAuthModeBtn.textContent = 'Login';
            usernameContainer.style.display = 'block';
            confirmPasswordContainer.style.display = 'block';
            usernameInput.required = true;
            confirmPasswordInput.required = true;
            authForm.classList.remove('hidden');
            verifyForm.classList.add('hidden');
        }
        authForm.reset();
        verifyForm.reset();
    }

    function showVerificationForm() {
        formTitle.textContent = 'Verify Email';
        authForm.classList.add('hidden');
        verifyForm.classList.remove('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleAuthModeBtn.textContent = 'Login';
    }

    toggleAuthModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMode();
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const username = usernameInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!isLoginMode && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        let url = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
        let body = isLoginMode ? { email, password } : { username, email, password };

        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? 'Logging in...' : 'Signing up...';

        try {
            console.log(`Sending ${isLoginMode ? 'login' : 'signup'} request to ${url}`);
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            console.log('Server response:', data);

            if (res.ok) {
                if (isLoginMode) {
                    if (data.user && /^[0-9a-fA-F]{24}$/.test(data.user.id) && data.user.username && data.user.email) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.href = 'chat.html';
                    } else {
                        console.error('Invalid user data in login response:', data);
                        alert('Login failed: Invalid user data from server');
                    }
                } else {
                    pendingEmail = data.email;
                    showVerificationForm();
                }
            } else {
                alert(data.msg || 'An error occurred');
            }
        } catch (error) {
            console.error('Network error during authentication:', error);
            alert('Network error or server unavailable');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Login' : 'Sign Up';
        }
    });

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = verificationCodeInput.value.trim();

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, code })
            });

            const data = await res.json();
            console.log('Verification response:', data);

            if (res.ok) {
                alert('Email verified successfully! Please log in.');
                toggleMode();
            } else {
                alert(data.msg || 'An error occurred during verification');
            }
        } catch (error) {
            console.error('Network error during verification:', error);
            alert('Network error or server unavailable');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify';
        }
    });
});