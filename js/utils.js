/**
 * 工具类 - 翻译、图标、数据处理
 */
class PokemonUtils {
    constructor() {
        this.translations = {};
        this.pokedex = {};
        this.formsIndex = {};
        this.statNames = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];
        this.statNamesChinese = ['HP', '攻击', '防御', '特攻', '特防', '速度'];
    }

    /**
     * 获取当前语言的属性名称
     */
    getStatNames() {
        if (typeof i18n !== 'undefined' && i18n.getLocale() === 'en') {
            return this.statNames;
        }
        return this.statNamesChinese;
    }

    /**
     * 加载翻译数据
     */
    async loadTranslations() {
        try {
            const response = await fetch('data/translate.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('加载翻译数据失败:', error);
            this.translations = {};
        }
    }

    /**
     * 加载宝可梦图鉴数据
     */
    async loadPokedex() {
        try {
            const response = await fetch('data/pokedex.json');
            this.pokedex = await response.json();
        } catch (error) {
            console.error('加载宝可梦图鉴失败:', error);
            this.pokedex = {};
        }
    }

    /**
     * 加载精灵图索引
     */
    async loadFormsIndex() {
        try {
            const response = await fetch('data/forms_index.json');
            this.formsIndex = await response.json();
        } catch (error) {
            console.error('加载精灵图索引失败:', error);
            this.formsIndex = {};
        }
    }

    /**
     * 初始化所有数据
     */
    async init() {
        await Promise.all([
            this.loadTranslations(),
            this.loadPokedex(),
            this.loadFormsIndex()
        ]);
    }

    /**
     * 翻译英文到中文
     */
    translate(englishText) {
        if (!englishText) return englishText;

        // 如果当前语言是英文，直接返回原文，不翻译
        if (typeof i18n !== 'undefined' && i18n.getLocale() === 'en') {
            return englishText;
        }

        // 直接查找
        if (this.translations[englishText]) {
            return this.translations[englishText];
        }

        // 忽略大小写查找
        const lowerText = englishText.toLowerCase();
        for (const [key, value] of Object.entries(this.translations)) {
            if (key.toLowerCase() === lowerText) {
                return value;
            }
        }

        // 处理带连字符的形态（如 Urshifu-Rapid-Strike）
        if (englishText.includes('-')) {
            const baseName = englishText.split('-')[0];
            if (this.translations[baseName]) {
                const suffix = englishText.substring(baseName.length);
                return this.translations[baseName] + this.translateSuffix(suffix);
            }
        }

        return englishText;
    }

    /**
     * 翻译形态后缀
     */
    translateSuffix(suffix) {
        // 如果当前语言是英文，直接返回原后缀
        if (typeof i18n !== 'undefined' && i18n.getLocale() === 'en') {
            return suffix;
        }

        const suffixMap = {
            '-Mega': '-超级',
            '-Alola': '-阿罗拉',
            '-Galar': '-伽勒尔',
            '-Hisui': '-洗翠',
            '-Paldea': '-帕底亚',
            '-Rapid-Strike': '-连击',
            '-Single-Strike': '-一击',
            '-Ice': '-冰',
            '-Water': '-水',
            '-Fire': '-火',
            '-Male': '-雄',
            '-Female': '-雌'
        };

        for (const [en, zh] of Object.entries(suffixMap)) {
            if (suffix.toLowerCase().includes(en.toLowerCase())) {
                return suffix.replace(new RegExp(en, 'i'), zh);
            }
        }

        return suffix;
    }

    /**
     * 获取宝可梦精灵图坐标
     * 返回 {row, col, x, y}
     */
    getPokemonSpriteCoords(pokemonName) {
        if (!pokemonName || pokemonName === 'ALL Pokemon') {
            return { row: 0, col: 0, x: 0, y: 0 };
        }

        // 标准化名称
        const normalizedName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 先查找 formsIndex
        let spriteNum = this.formsIndex[normalizedName];

        // 如果没找到，查找 pokedex
        if (spriteNum === undefined && this.pokedex[normalizedName]) {
            spriteNum = this.pokedex[normalizedName].num || 0;
        }

        // 如果还是没找到，默认为0
        if (spriteNum === undefined) {
            spriteNum = 0;
        }

        // 计算行列（每行12个精灵）
        const col = spriteNum % 12;
        const row = Math.floor(spriteNum / 12);

        return {
            row: row,
            col: col,
            x: col * -40,  // 每个精灵宽40px
            y: row * -30   // 每个精灵高30px
        };
    }

    /**
     * 获取道具精灵图坐标
     * 返回 {row, col, x, y}
     */
    getItemSpriteCoords(itemName, itemsData) {
        if (!itemName || !itemsData) {
            return { row: 0, col: 0, x: 0, y: 0 };
        }

        // 标准化道具名称
        const normalizedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 从道具数据中获取 spritenum
        const itemData = itemsData[normalizedName];
        if (!itemData || itemData.spritenum === undefined) {
            console.warn(`Item sprite not found for: ${itemName} (${normalizedName})`);
            return { row: 0, col: 0, x: 0, y: 0 };
        }

        const spriteNum = itemData.spritenum;

        // 计算行列（每行16个道具图标）
        const col = spriteNum % 16;
        const row = Math.floor(spriteNum / 16);

        return {
            row: row,
            col: col,
            x: col * -24,  // 每个道具图标宽24px
            y: row * -24   // 每个道具图标高24px
        };
    }

    /**
     * 格式化EVs显示（包括0值）
     */
    formatEVs(evs) {
        if (!evs || !Array.isArray(evs)) {
            evs = [0, 0, 0, 0, 0, 0];
        }

        // 确保是6个值
        while (evs.length < 6) {
            evs.push(0);
        }

        const statNames = this.getStatNames();
        const formatted = [];
        for (let i = 0; i < 6; i++) {
            const ev = evs[i] || 0;
            formatted.push({
                stat: this.statNames[i],
                statChinese: statNames[i],
                value: ev
            });
        }

        return formatted;
    }

    /**
     * 格式化IVs显示
     */
    formatIVs(ivs) {
        if (!ivs || !Array.isArray(ivs)) {
            ivs = [31, 31, 31, 31, 31, 31];
        }

        // 确保是6个值
        while (ivs.length < 6) {
            ivs.push(31);
        }

        const statNames = this.getStatNames();
        const formatted = [];
        for (let i = 0; i < 6; i++) {
            const iv = ivs[i] === undefined || ivs[i] === null ? 31 : ivs[i];
            // 只显示非31的IV（包括0）
            if (iv !== 31) {
                formatted.push({
                    stat: this.statNames[i],
                    statChinese: statNames[i],
                    value: iv
                });
            }
        }

        return formatted;
    }

    /**
     * 获取性格加减成信息
     * 返回 { boosted, reduced } 索引（0-5）
     */
    getNatureModifiers(nature) {
        if (!nature) return { boosted: null, reduced: null };

        const natureData = {
            // 中性性格（无加减成）
            'Hardy': { boosted: null, reduced: null },
            'Docile': { boosted: null, reduced: null },
            'Serious': { boosted: null, reduced: null },
            'Bashful': { boosted: null, reduced: null },
            'Quirky': { boosted: null, reduced: null },

            // +攻击
            'Lonely': { boosted: 1, reduced: 2 },   // +Atk -Def
            'Brave': { boosted: 1, reduced: 5 },    // +Atk -Spe
            'Adamant': { boosted: 1, reduced: 3 },  // +Atk -SpA
            'Naughty': { boosted: 1, reduced: 4 },  // +Atk -SpD

            // +防御
            'Bold': { boosted: 2, reduced: 1 },     // +Def -Atk
            'Relaxed': { boosted: 2, reduced: 5 },  // +Def -Spe
            'Impish': { boosted: 2, reduced: 3 },   // +Def -SpA
            'Lax': { boosted: 2, reduced: 4 },      // +Def -SpD

            // +特攻
            'Modest': { boosted: 3, reduced: 1 },   // +SpA -Atk
            'Mild': { boosted: 3, reduced: 2 },     // +SpA -Def
            'Quiet': { boosted: 3, reduced: 5 },    // +SpA -Spe
            'Rash': { boosted: 3, reduced: 4 },     // +SpA -SpD

            // +特防
            'Calm': { boosted: 4, reduced: 1 },     // +SpD -Atk
            'Gentle': { boosted: 4, reduced: 2 },   // +SpD -Def
            'Sassy': { boosted: 4, reduced: 5 },    // +SpD -Spe
            'Careful': { boosted: 4, reduced: 3 },  // +SpD -SpA

            // +速度
            'Timid': { boosted: 5, reduced: 1 },    // +Spe -Atk
            'Hasty': { boosted: 5, reduced: 2 },    // +Spe -Def
            'Jolly': { boosted: 5, reduced: 3 },    // +Spe -SpA
            'Naive': { boosted: 5, reduced: 4 }     // +Spe -SpD
        };

        return natureData[nature] || { boosted: null, reduced: null };
    }

    /**
     * 转义HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 获取招式属性类型
     */
    getMoveType(move, movesData) {
        if (!move || !movesData) return null;
        const normalizedName = move.toLowerCase().replace(/[^a-z0-9]/g, '');
        return movesData[normalizedName]?.type || null;
    }

    /**
     * 获取招式描述
     */
    getMoveDesc(move, movesData) {
        if (!move || !movesData) return '无描述';
        const normalizedName = move.toLowerCase().replace(/[^a-z0-9]/g, '');
        const moveData = movesData[normalizedName];
        if (!moveData) {
            console.warn(`Move data not found for: ${move} (${normalizedName})`);
            return '无描述';
        }

        // 优先使用 shortDesc（简短描述），其次 desc
        const desc = moveData.shortDesc || moveData.desc || '无描述';
        // 翻译描述
        return this.translate(desc);
    }

    /**
     * 获取特性描述
     */
    getAbilityDesc(ability, abilitiesData) {
        if (!ability || !abilitiesData) return '无描述';
        const normalizedName = ability.toLowerCase().replace(/[^a-z0-9]/g, '');
        const abilityData = abilitiesData[normalizedName];
        if (!abilityData) {
            console.warn(`Ability data not found for: ${ability} (${normalizedName})`);
            return '无描述';
        }

        // 优先使用 shortDesc（简短描述），其次 desc
        const desc = abilityData.shortDesc || abilityData.desc || '无描述';
        // 翻译描述
        return this.translate(desc);
    }

    /**
     * 获取道具描述
     */
    getItemDesc(item, itemsData) {
        if (!item || !itemsData) return '无描述';
        const normalizedName = item.toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemData = itemsData[normalizedName];
        if (!itemData) {
            console.warn(`Item data not found for: ${item} (${normalizedName})`);
            return '无描述';
        }

        // 优先使用 shortDesc（简短描述），其次 desc
        const desc = itemData.shortDesc || itemData.desc || '无描述';
        // 翻译描述
        return this.translate(desc);
    }

    /**
     * 获取所有宝可梦名称列表（用于自动补全）
     */
    getAllPokemonNames() {
        const names = [];
        for (const [key, data] of Object.entries(this.pokedex)) {
            if (data.name) {
                names.push(data.name);
            }
        }
        return names.sort();
    }

    /**
     * 获取所有道具名称列表
     */
    getAllItemNames(itemsData) {
        const names = [];
        for (const [key, data] of Object.entries(itemsData)) {
            if (data.name) {
                names.push(data.name);
            }
        }
        return names.sort();
    }

    /**
     * 获取所有特性名称列表
     */
    getAllAbilityNames(abilitiesData) {
        const names = [];
        for (const [key, data] of Object.entries(abilitiesData)) {
            if (data.name) {
                names.push(data.name);
            }
        }
        return names.sort();
    }

    /**
     * 获取所有招式名称列表
     */
    getAllMoveNames(movesData) {
        const names = [];
        for (const [key, data] of Object.entries(movesData)) {
            if (data.name) {
                names.push(data.name);
            }
        }
        return names.sort();
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.PokemonUtils = PokemonUtils;
}
