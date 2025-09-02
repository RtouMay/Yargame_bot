document.addEventListener('DOMContentLoaded', () => {

    const SUBSCRIPTION_CODES_FILE = 'subscription_codes.txt';
    const DNS_LIST_FILE = 'dns_list.txt';
    const ACTIVATION_DATA_KEY = 'yarGameDnsActivations';

    let validSubscriptionCodes = [];
    let dnsList = [];
    let sessionHistory = [];

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
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');

    // --- توابع اصلی ---

    async function loadFiles() {
        try {
            const [codesResponse, dnsResponse] = await Promise.all([
                fetch(SUBSCRIPTION_CODES_FILE),
                fetch(DNS_LIST_FILE)
            ]);
            if (!codesResponse.ok) throw new Error(`خطا در بارگذاری کدهای اشتراک`);
            if (!dnsResponse.ok) throw new Error(`خطا در بارگذاری لیست DNS`);
            
            const codesText = await codesResponse.text();
            validSubscriptionCodes = codesText.split('\n').map(code => code.trim()).filter(Boolean);

            const dnsText = await dnsResponse.text();
            dnsList = dnsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
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
            console.error('Error loading files:', error);
            alert('خطا در بارگذاری فایل‌ها. مطمئن شوید پروژه روی سرور محلی اجرا شده و فایل‌های .txt وجود دارند.');
        }
    }

    function getDurationFromCode(code) {
        if (code.includes('-1M-')) return 30;
        if (code.includes('-2M-')) return 60;
        if (code.includes('-3M-')) return 90;
        if (code.includes('-5M-')) return 150;
        if (code.includes('-LT-')) return Infinity; // دائمی
        return null;
    }

    function handleLogin() {
        const enteredCode = subscriptionCodeInput.value.trim();
        if (!validSubscriptionCodes.includes(enteredCode)) {
            alert('کد اشتراک وارد شده معتبر نیست!');
            return;
        }

        const duration = getDurationFromCode(enteredCode);
        if (duration === null) {
            alert('فرمت کد اشتراک صحیح نیست.');
            return;
        }

        if (duration !== Infinity) {
            const activations = JSON.parse(localStorage.getItem(ACTIVATION_DATA_KEY) || '{}');
            const activationDateStr = activations[enteredCode];

            if (activationDateStr) {
                const activationDate = new Date(activationDateStr);
                const expiryDate = new Date(activationDate);
                expiryDate.setDate(expiryDate.getDate() + duration);
                
                if (new Date() > expiryDate) {
                    alert('این کد اشتراک منقضی شده است.');
                    return;
                }
            } else {
                // اولین استفاده از کد، تاریخ را ثبت کن
                activations[enteredCode] = new Date().toISOString();
                localStorage.setItem(ACTIVATION_DATA_KEY, JSON.stringify(activations));
            }
        }
        
        // موفقیت در ورود
        sessionHistory = []; // پاک کردن سابقه با هر ورود جدید
        updateHistoryDisplay();
        loginSection.classList.add('hidden');
        generatorSection.classList.remove('hidden');
    }

    function generateDns() {
        if (dnsList.length === 0) {
            alert('لیست DNS در دسترس نیست.');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * dnsList.length);
        const selectedDns = dnsList[randomIndex];
        
        sessionHistory.unshift(selectedDns); // اضافه کردن به ابتدای لیست سابقه
        updateHistoryDisplay();

        displayDns(selectedDns);
    }
    
    function displayDns(dnsData) {
        const formattedDns = `dns1: ${dnsData.dns1}\ndns2: ${dnsData.dns2}`;
        dnsOutput.textContent = formattedDns;
        
        dnsFlagEl.textContent = dnsData.flag;
        dnsCountryEl.textContent = dnsData.country;

        const ping = Math.floor(Math.random() * (250 - 100 + 1)) + 100;
        pingValueEl.textContent = ping;
        
        pingValueEl.className = 'ping-value'; // Reset classes
        if (ping < 150) pingValueEl.classList.add('ping-good');
        else if (ping < 200) pingValueEl.classList.add('ping-medium');
        else pingValueEl.classList.add('ping-bad');
        
        dnsResultContainer.classList.remove('hidden');
    }

    function updateHistoryDisplay() {
        if (sessionHistory.length > 0) {
            historySection.classList.remove('hidden');
            historyList.innerHTML = '';
            sessionHistory.forEach(dns => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="history-info">${dns.flag}</span> <span class="history-dns">${dns.dns1}</span>`;
                li.onclick = () => displayDns(dns); // با کلیک روی آیتم سابقه، آن را نمایش بده
                historyList.appendChild(li);
            });
        } else {
            historySection.classList.add('hidden');
        }
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
                alert('خطا در کپی کردن.');
            });
    }
    
    async function initializeApp() {
        await loadFiles();
        loginBtn.addEventListener('click', handleLogin);
        generateBtn.addEventListener('click', generateDns);
        copyBtn.addEventListener('click', copyDnsToClipboard);
        subscriptionCodeInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') handleLogin();
        });
    }

    initializeApp();
});
