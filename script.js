document.addEventListener('DOMContentLoaded', () => {

    // --- آدرس منابع ---
    const SUBSCRIPTION_CODES_FILE = 'subscription_codes.txt';
    const LOCAL_DNS_FILE = 'dns_list.txt';
    const REMOTE_DNS_URL = 'https://public-dns.info/nameservers.csv'; // لینک منبع دوم

    // --- متغیرهای سراسری ---
    let validSubscriptionCodes = [];
    let dnsList = [];

    // --- انتخاب عناصر صفحه ---
    const loginSection = document.getElementById('login-section');
    const generatorSection = document.getElementById('generator-section');
    const subscriptionCodeInput = document.getElementById('subscription-code');
    const loginBtn = document.getElementById('login-btn');
    const generateBtn = document.getElementById('generate-btn');
    const dnsResultContainer = document.getElementById('dns-result-container');
    const dnsOutput = document.getElementById('dns-output');
    const copyBtn = document.getElementById('copy-btn');
    const pingValueEl = document.getElementById('ping-value');
    const dnsFlagEl = document.getElementById('dns-flag');
    const dnsCountryEl = document.getElementById('dns-country');

    // --- توابع برای خواندن فایل‌ها و لینک ---

    // این تابع کدهای اشتراک رو از فایل محلی میخونه
    async function loadSubscriptionCodes() {
        try {
            const response = await fetch(SUBSCRIPTION_CODES_FILE);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            validSubscriptionCodes = text.split('\n').map(code => code.trim()).filter(Boolean);
        } catch (error) {
            console.error('Error loading subscription codes:', error);
            alert('خطا در بارگذاری کدهای اشتراک.');
        }
    }

    // این تابع DNS ها رو از دو منبع (محلی و اینترنتی) میخونه و ترکیب میکنه
    async function loadDnsList() {
        let localDns = [];
        let remoteDns = [];

        // خواندن از فایل محلی
        try {
            const response = await fetch(LOCAL_DNS_FILE);
            const text = await response.text();
            localDns = text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
                const parts = line.split(',');
                if (parts.length < 4) return null;
                const dns1 = parts[0].split(':')[1]?.trim();
                const dns2 = parts[1].split(':')[1]?.trim();
                const country = parts[2]?.trim();
                const flag = parts[3]?.trim();
                if (dns1 && dns2 && country && flag) return { dns1, dns2, country, flag };
                return null;
            }).filter(Boolean);
        } catch (error) {
            console.warn('Could not load local DNS file. Continuing without it.', error);
        }

        // خواندن از لینک اینترنتی
        try {
            const response = await fetch(REMOTE_DNS_URL);
            const text = await response.text();
            // فایل CSV فقط یک IP در هر خط داره، پس dns2 رو خالی میذاریم
            remoteDns = text.split('\n').slice(1) // Skip header row
                .map(line => line.trim()).filter(Boolean).map(line => {
                    const parts = line.split(',');
                    if (parts.length < 2) return null;
                    const dns1 = parts[0];
                    const countryCode = parts[1];
                    // تبدیل کد کشور به اسم و پرچم (برای چند کشور معروف)
                    const countryInfo = getCountryInfo(countryCode);
                    if (dns1) return { dns1, dns2: '0.0.0.0', country: countryInfo.name, flag: countryInfo.flag };
                    return null;
                }).filter(Boolean);
        } catch (error) {
            console.warn('Could not load remote DNS URL. Continuing without it.', error);
        }

        // ترکیب دو لیست و حذف موارد تکراری
        const combinedList = [...localDns, ...remoteDns];
        const uniqueDns = new Map(combinedList.map(item => [item.dns1, item]));
        dnsList = Array.from(uniqueDns.values());

        if (dnsList.length === 0) {
            alert('هیچ DNS معتبری بارگذاری نشد. لطفاً فایل‌های منبع را بررسی کنید.');
        }
    }

    // تابع کمکی برای تبدیل کد کشور به اسم و پرچم
    function getCountryInfo(code) {
        const countryMap = {
            'US': { name: 'USA', flag: '🇺🇸' },
            'DE': { name: 'Germany', flag: '🇩🇪' },
            'GB': { name: 'UK', flag: '🇬🇧' },
            'RU': { name: 'Russia', flag: '🇷🇺' },
            'NL': { name: 'Netherlands', flag: '🇳🇱' },
            'CH': { name: 'Switzerland', flag: '🇨🇭' },
            'IR': { name: 'Iran', flag: '🇮🇷' },
        };
        return countryMap[code] || { name: code, flag: '🏳️' };
    }

    // --- بقیه توابع برنامه ---
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
            alert('لیست DNS در دسترس نیست.');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * dnsList.length);
        const selectedDns = dnsList[randomIndex];

        const formattedDns = `dns1: ${selectedDns.dns1}\ndns2: ${selectedDns.dns2}`;
        dnsOutput.textContent = formattedDns;
        
        dnsFlagEl.textContent = selectedDns.flag;
        dnsCountryEl.textContent = selectedDns.country;

        const ping = Math.floor(Math.random() * (250 - 100 + 1)) + 100;
        pingValueEl.textContent = ping;
        
        pingValueEl.classList.remove('ping-good', 'ping-medium', 'ping-bad');
        if (ping < 150) pingValueEl.classList.add('ping-good');
        else if (ping < 200) pingValueEl.classList.add('ping-medium');
        else pingValueEl.classList.add('ping-bad');
        
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
