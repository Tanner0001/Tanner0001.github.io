// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://mqdumsqnsezmlcyxvkwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHVtc3Fuc2V6bWxjeXh2a3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQzMTUsImV4cCI6MjA4NzUzMDMxNX0.qs24B8CQ193Uqot6HB5guHtJWJgycx654AR-08JXyi4';

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
    const isLoginPage = window.location.pathname.endsWith('admin/') || window.location.pathname.endsWith('admin/index.html');
    const isDashboardPage = window.location.pathname.includes('dashboard.html');

    if (session && isLoginPage) {
        window.location.href = 'dashboard.html';
    } else if (!session && isDashboardPage) {
        window.location.href = 'index.html';
    }
    return session;
}

// Run check on every auth-related page load
checkUser();