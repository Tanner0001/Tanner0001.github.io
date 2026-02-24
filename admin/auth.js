// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Use a different name for the client to avoid conflicts with the library
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const submitBtn = loginForm.querySelector('button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Authorizing...';
        lucide.createIcons();

        try {
            const { data, error } = await sbClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            window.location.href = 'dashboard.html';
        } catch (err) {
            authError.textContent = err.message;
            authError.classList.remove('hidden');
            submitBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    });
}

async function checkUser() {
    const { data: { session } } = await sbClient.auth.getSession();
    if (!session && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
    return session;
}