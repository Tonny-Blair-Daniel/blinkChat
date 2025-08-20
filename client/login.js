document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const verifyForm = document.getElementById('verifyForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetCodeForm = document.getElementById('resetCodeForm');
    const newPasswordForm = document.getElementById('newPasswordForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const resetBtn = document.getElementById('resetBtn');
    const verifyResetBtn = document.getElementById('verifyResetBtn');
    const submitNewPasswordBtn = document.getElementById('submitNewPasswordBtn');
    const toggleAuthModeBtn = document.getElementById('toggleAuthMode');
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    const toggleText = document.getElementById('toggleText');
    const usernameContainer = document.getElementById('usernameContainer');
    const confirmPasswordContainer = document.getElementById('confirmPasswordContainer');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const verificationCodeInput = document.getElementById('verificationCode');
    const resetEmailInput = document.getElementById('resetEmail');
    const resetCodeInput = document.getElementById('resetCode');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPassword');


    let isLoginMode = true;
    let pendingEmail = null;

    if (window.location.hash === '#signup') {
        isLoginMode = false;
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
        resetPasswordForm.classList.add('hidden');
        resetCodeForm.classList.add('hidden');
        newPasswordForm.classList.add('hidden');
        forgotPasswordBtn.classList.add('hidden');
    }

    if (window.location.search.includes('email') || window.location.search.includes('password')) {
        console.warn('Sensitive data detected in URL, redirecting to clean URL');
        window.location.href = 'login.html';
        return;
    }

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
            resetPasswordForm.classList.add('hidden');
            resetCodeForm.classList.add('hidden');
            newPasswordForm.classList.add('hidden');
            forgotPasswordBtn.classList.remove('hidden');
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
            resetPasswordForm.classList.add('hidden');
            resetCodeForm.classList.add('hidden');
            newPasswordForm.classList.add('hidden');
            forgotPasswordBtn.classList.add('hidden');
        }
        authForm.reset();
        verifyForm.reset();
        resetPasswordForm.reset();
        resetCodeForm.reset();
        newPasswordForm.reset();
    }

    function showVerificationForm() {
        formTitle.textContent = 'Verify Email';
        authForm.classList.add('hidden');
        verifyForm.classList.remove('hidden');
        resetPasswordForm.classList.add('hidden');
        resetCodeForm.classList.add('hidden');
        newPasswordForm.classList.add('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleAuthModeBtn.textContent = 'Login';
        forgotPasswordBtn.classList.remove('hidden');
    }

    function showResetPasswordForm() {
        formTitle.textContent = 'Reset Password';
        authForm.classList.add('hidden');
        verifyForm.classList.add('hidden');
        resetPasswordForm.classList.remove('hidden');
        resetCodeForm.classList.add('hidden');
        newPasswordForm.classList.add('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleAuthModeBtn.textContent = 'Login';
        forgotPasswordBtn.classList.add('hidden');
    }

    function showResetCodeForm() {
        formTitle.textContent = 'Enter Reset Code';
        authForm.classList.add('hidden');
        verifyForm.classList.add('hidden');
        resetPasswordForm.classList.add('hidden');
        resetCodeForm.classList.remove('hidden');
        newPasswordForm.classList.add('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleAuthModeBtn.textContent = 'Login';
        forgotPasswordBtn.classList.add('hidden');
    }

    function showNewPasswordForm() {
        formTitle.textContent = 'Set New Password';
        authForm.classList.add('hidden');
        verifyForm.classList.add('hidden');
        resetPasswordForm.classList.add('hidden');
        resetCodeForm.classList.add('hidden');
        newPasswordForm.classList.remove('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleAuthModeBtn.textContent = 'Login';
        forgotPasswordBtn.classList.add('hidden');
    }

    function togglePasswordVisibility(input, button) {
        if (input.type === 'password') {
            input.type = 'text';
            button.querySelector('i').classList.remove('fa-eye');
            button.querySelector('i').classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            button.querySelector('i').classList.remove('fa-eye-slash');
            button.querySelector('i').classList.add('fa-eye');
        }
    }

    toggleAuthModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMode();
    });

    forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showResetPasswordForm();
    });

    togglePasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(passwordInput, togglePasswordBtn);
    });

    toggleConfirmPasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn);
    });

    toggleNewPasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(newPasswordInput, toggleNewPasswordBtn);
    });

    toggleConfirmNewPasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(confirmNewPasswordInput, toggleConfirmNewPasswordBtn);
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

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = resetEmailInput.value.trim();

        resetBtn.disabled = true;
        resetBtn.textContent = 'Sending...';

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            console.log('Reset password response:', data);

            if (res.ok) {
                pendingEmail = email;
                alert('Password reset code sent. Please check your email.');
                showResetCodeForm();
            } else {
                alert(data.msg || 'An error occurred');
            }
        } catch (error) {
            console.error('Network error during password reset:', error);
            alert('Network error or server unavailable');
        } finally {
            resetBtn.disabled = false;
            resetBtn.textContent = 'Send Reset Code';
        }
    });

    resetCodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = resetCodeInput.value.trim();

        verifyResetBtn.disabled = true;
        verifyResetBtn.textContent = 'Verifying...';

        try {
            const res = await fetch('/api/auth/reset-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, code })
            });

            const data = await res.json();
            console.log('Reset code verification response:', data);

            if (res.ok) {
                showNewPasswordForm();
            } else {
                alert(data.msg || 'An error occurred');
            }
        } catch (error) {
            console.error('Network error during reset code verification:', error);
            alert('Network error or server unavailable');
        } finally {
            verifyResetBtn.disabled = false;
            verifyResetBtn.textContent = 'Verify Reset Code';
        }
    });

    newPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = newPasswordInput.value.trim();
        const confirmNewPassword = confirmNewPasswordInput.value.trim();

        if (newPassword !== confirmNewPassword) {
            alert('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        submitNewPasswordBtn.disabled = true;
        submitNewPasswordBtn.textContent = 'Resetting...';

        try {
            const res = await fetch('/api/auth/reset-password/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, newPassword })
            });

            const data = await res.json();
            console.log('New password response:', data);

            if (res.ok) {
                alert('Password reset successfully! Please log in.');
                toggleMode();
            } else {
                alert(data.msg || 'An error occurred');
            }
        } catch (error) {
            console.error('Network error during password reset confirmation:', error);
            alert('Network error or server unavailable');
        } finally {
            submitNewPasswordBtn.disabled = false;
            submitNewPasswordBtn.textContent = 'Reset Password';
        }
    });
});