const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        errorMessage.textContent = 'Email ou senha inválidos.';
        console.error('Erro no login:', error);
    } else {
        window.location.href = '/3det/';
    }
});