// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://mqdumsqnsezmlcyxvkwq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kVsPiJutYuMj8XniLjDGVw_LnULXf6e';

// Initialize Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading state
        const submitBtn = loginForm.querySelector('button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Authorizing...';
        lucide.createIcons();

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Success! Redirect to dashboard
            window.location.href = 'dashboard.html';
        } catch (err) {
            authError.textContent = err.message;
            authError.classList.remove('hidden');
            submitBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    });
}

// Simple check for authenticated session
async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
    return session;
}
