document.addEventListener('DOMContentLoaded', () => {

    const SUBSCRIPTION_CODES_FILE = 'subscription_codes.txt';
    const DNS_LIST_FILE = 'dns_list.txt';

    let validSubscriptionCodes = [];
    let dnsList = [];

    const loginSection = document.getElementById('login-section');
    const generatorSection = document.getElementById('generator-section');
    const subscriptionCodeInput = document.getElementById('subscription-code');
    const loginBtn = document.getElementById('login-btn');
    const generateBtn = document.getElementById('generate-btn');
    const dnsResultContainer = document.getElementById('dns-result-container');
    const dnsOutput = document.getElementById('dns-output');
    const copyBtn = document.getElementById('copy-btn');
    const pingValueEl = document.getElementById('ping-value');

    async function loadSubscriptionCodes() {
        try {
            const response = await fetch(SUBSCRIPTION_CODES_FILE);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            validSubscriptionCodes = text.split('\n').map(code => code.trim()).filter(Boolean);
            if (validSubscriptionCodes.length === 0) console.warn('Subscription codes file is empty or missing.');
        } catch (error) {
            console.error('Error loading subscription codes:', error);
            alert('خطا در بارگذاری کدهای اشتراک. لطفا مطمئن شوید فایل subscription_codes.txt وجود دارد.');
        }
    }

    async function loadDnsList() {
        try {
            const response = await fetch(DNS_LIST_FILE);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            dnsList = text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
                const parts = line.split(',');
                const dns1 = parts[0].split(':')[1]?.trim();
                const dns2 = parts[1].split(':')[1]?.trim();
                if (dns1 && dns2) return { dns1, dns2 };
                return null;
            }).filter(Boolean);
            if (dnsList.length === 0) console.warn('DNS list file is empty or has incorrect format.');
        } catch (error) {
            console.error('Error loading DNS list:', error);
            alert('خطا در بارگذاری لیست DNS. لطفا مطمئن شوید فایل dns_list.txt وجود دارد و فرمت آن صحیح است.');
        }
    }

    function handleLogin() {
        const enteredCode = subscriptionCodeInput.value.trim();
        if (validSubscriptionCodes.includes(enteredCode)) {
            loginSection.classList.add('hidden');
            generatorSection.classList.remove('hidden');
        } else {
            alert('کد اشتراک وارد شده معتبر نیست!');
        }
    }

    function generateDns() {
        if (dnsList.length === 0) {
            alert('لیست DNS خالی است یا بارگذاری نشده. لطفاً فایل dns_list.txt را بررسی کنید.');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * dnsList.length);
        const selectedDns = dnsList[randomIndex];

        const formattedDns = `dns1: ${selectedDns.dns1}\ndns2: ${selectedDns.dns2}`;
        dnsOutput.textContent = formattedDns;

        const ping = Math.floor(Math.random() * (250 - 100 + 1)) + 100;
        pingValueEl.textContent = ping;
        
        pingValueEl.classList.remove('ping-good', 'ping-medium', 'ping-bad');
        if (ping < 150) {
            pingValueEl.classList.add('ping-good');
        } else if (ping < 200) {
            pingValueEl.classList.add('ping-medium');
        } else {
            pingValueEl.classList.add('ping-bad');
        }
        
        dnsResultContainer.classList.remove('hidden');
    }

    function copyDnsToClipboard() {
        if (!dnsOutput.textContent) return;
        navigator.clipboard.writeText(dnsOutput.textContent)
            .then(() => {
                copyBtn.textContent = 'کپی شد!';
                setTimeout(() => { copyBtn.textContent = 'کپی کردن'; }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy DNS:', err);
                alert('خطا در کپی کردن. لطفاً به صورت دستی کپی کنید.');
            });
    }
    
    async function initializeApp() {
        await loadSubscriptionCodes();
        await loadDnsList();
        loginBtn.addEventListener('click', handleLogin);
        generateBtn.addEventListener('click', generateDns);
        copyBtn.addEventListener('click', copyDnsToClipboard);
        subscriptionCodeInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') handleLogin();
        });
    }

    initializeApp();
});