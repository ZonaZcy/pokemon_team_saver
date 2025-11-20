/**
 * i18n 国际化核心库
 * 支持中英文双语切换
 */
class I18n {
    constructor() {
        this.currentLocale = 'zh-CN';
        this.translations = {};
        this.fallbackLocale = 'zh-CN';
        this.supportedLocales = ['zh-CN', 'en'];
    }

    /**
     * 初始化 i18n 系统
     */
    async init() {
        // 从 localStorage 读取用户偏好
        const savedLocale = localStorage.getItem('pokemon_team_locale');
        if (savedLocale && this.supportedLocales.includes(savedLocale)) {
            this.currentLocale = savedLocale;
        } else {
            // 检测浏览器语言
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('zh')) {
                this.currentLocale = 'zh-CN';
            } else {
                this.currentLocale = 'en';
            }
        }

        // 加载语言文件
        await this.loadLocale(this.currentLocale);

        // 更新 HTML lang 属性
        document.documentElement.lang = this.currentLocale === 'zh-CN' ? 'zh-CN' : 'en';
    }

    /**
     * 加载语言文件
     */
    async loadLocale(locale) {
        try {
            const response = await fetch(`locales/${locale}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load locale: ${locale}`);
            }
            this.translations[locale] = await response.json();
        } catch (error) {
            console.error(`Failed to load locale ${locale}:`, error);
            // 如果加载失败，尝试加载备用语言
            if (locale !== this.fallbackLocale) {
                await this.loadLocale(this.fallbackLocale);
            }
        }
    }

    /**
     * 获取翻译文本
     * @param {string} key - 翻译键，支持点号分隔 (如 'app.title')
     * @param {object} params - 替换参数 (如 {count: 5})
     * @returns {string} 翻译后的文本
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLocale];

        // 遍历键路径获取值
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // 尝试从备用语言获取
                value = this.getFromFallback(keys);
                break;
            }
        }

        // 如果没找到，返回键本身
        if (typeof value !== 'string') {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        // 替换参数
        return this.interpolate(value, params);
    }

    /**
     * 从备用语言获取翻译
     */
    getFromFallback(keys) {
        let value = this.translations[this.fallbackLocale];
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        return value;
    }

    /**
     * 参数插值替换
     */
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params.hasOwnProperty(key) ? params[key] : match;
        });
    }

    /**
     * 切换语言
     */
    async setLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            console.error(`Unsupported locale: ${locale}`);
            return false;
        }

        // 加载新语言文件（如果尚未加载）
        if (!this.translations[locale]) {
            await this.loadLocale(locale);
        }

        this.currentLocale = locale;

        // 保存到 localStorage
        localStorage.setItem('pokemon_team_locale', locale);

        // 更新 HTML lang 属性
        document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';

        // 触发语言切换事件
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));

        return true;
    }

    /**
     * 获取当前语言
     */
    getLocale() {
        return this.currentLocale;
    }

    /**
     * 获取支持的语言列表
     */
    getSupportedLocales() {
        return this.supportedLocales;
    }

    /**
     * 更新页面上所有带 data-i18n 属性的元素
     */
    updatePageTranslations() {
        // 更新文本内容
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // 检查元素是否包含图标（fa或其他子元素需要保留）
            const iconElements = el.querySelectorAll('i.fa, i[class*="fa-"]');

            if (iconElements.length > 0) {
                // 保存所有图标元素
                const icons = Array.from(iconElements);

                // 如果翻译包含HTML标签，使用innerHTML
                if (translation.includes('<br>') || translation.includes('<')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }

                // 恢复图标元素到开头
                icons.forEach(icon => {
                    el.insertBefore(icon, el.firstChild);
                    // 在图标后添加空格
                    el.insertBefore(document.createTextNode(' '), icon.nextSibling);
                });
            } else {
                // 没有图标，正常更新
                if (translation.includes('<br>') || translation.includes('<')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // 更新 placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // 更新 title 属性
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // 更新页面标题
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }
}

// 创建全局实例
const i18n = new I18n();
