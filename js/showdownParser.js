/**
 * Showdown格式解析器
 * 支持导入和导出 Pokemon Showdown 格式的队伍
 */
class ShowdownParser {
    constructor() {
        this.statMap = { HP: 0, Atk: 1, Def: 2, SpA: 3, SpD: 4, Spe: 5 };
        this.statNames = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];
    }

    /**
     * 解析 Showdown 格式的队伍文本
     */
    parseTeam(showdownText) {
        const pokemons = [];
        const sets = showdownText.trim().split(/\n\n+/);

        for (const setText of sets) {
            if (!setText.trim()) continue;
            const pokemon = this.parsePokemon(setText.trim());
            if (pokemon) {
                pokemons.push(pokemon);
            }
        }

        return pokemons;
    }

    /**
     * 解析单个宝可梦配置
     */
    parsePokemon(setText) {
        const lines = setText.split('\n');
        if (lines.length === 0) return null;

        const pokemon = {
            name: '',
            nickname: '',
            item: '',
            ability: '',
            tera_type: '',
            evs: [0, 0, 0, 0, 0, 0],
            ivs: [31, 31, 31, 31, 31, 31],
            nature: '',
            moves: [],
            gender: '',
            level: 100,
            shiny: false
        };

        // 解析第一行：名字、性别、道具
        const firstLine = lines[0].trim();
        this.parseFirstLine(firstLine, pokemon);

        // 解析其他行
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('Ability:')) {
                pokemon.ability = line.substring('Ability:'.length).trim();
            } else if (line.startsWith('Level:')) {
                pokemon.level = parseInt(line.substring('Level:'.length).trim()) || 100;
            } else if (line.startsWith('Shiny:')) {
                pokemon.shiny = line.includes('Yes');
            } else if (line.startsWith('Tera Type:')) {
                pokemon.tera_type = line.substring('Tera Type:'.length).trim();
            } else if (line.startsWith('EVs:')) {
                pokemon.evs = this.parseStats(line.substring('EVs:'.length), 0);
            } else if (line.startsWith('IVs:')) {
                pokemon.ivs = this.parseStats(line.substring('IVs:'.length), 31);
            } else if (line.includes('Nature')) {
                pokemon.nature = line.split(/\s+/)[0];
            } else if (line.startsWith('-')) {
                const move = line.substring(1).trim();
                if (move) {
                    pokemon.moves.push(move);
                }
            }
        }

        return pokemon;
    }

    /**
     * 解析第一行（名字、昵称、性别、道具）
     */
    parseFirstLine(line, pokemon) {
        let namePart = line;
        let item = '';

        // 检查是否有道具
        if (line.includes(' @ ')) {
            const parts = line.split(' @ ');
            namePart = parts[0];
            item = parts.slice(1).join(' @ ').trim();
            pokemon.item = item;
        }

        // 检查是否有性别
        const genderMatch = namePart.match(/\(([MF])\)/);
        if (genderMatch) {
            pokemon.gender = genderMatch[1];
            namePart = namePart.replace(/\([MF]\)/, '').trim();
        }

        // 检查是否有昵称
        const nicknameMatch = namePart.match(/^(.+?)\s*\((.+?)\)$/);
        if (nicknameMatch) {
            pokemon.nickname = nicknameMatch[1].trim();
            pokemon.name = nicknameMatch[2].trim();
        } else {
            pokemon.name = namePart.trim();
        }
    }

    /**
     * 解析能力值（EVs/IVs）
     */
    parseStats(statText, defaultValue) {
        const stats = new Array(6).fill(defaultValue);
        const pairs = statText.split('/');

        for (const pair of pairs) {
            const trimmed = pair.trim();
            if (!trimmed) continue;

            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                const parsedValue = parseInt(parts[0]);
                const value = isNaN(parsedValue) ? defaultValue : parsedValue;
                const stat = parts[1];
                if (this.statMap.hasOwnProperty(stat)) {
                    stats[this.statMap[stat]] = value;
                }
            }
        }

        return stats;
    }

    /**
     * 将宝可梦列表导出为 Showdown 格式
     */
    exportTeam(pokemons) {
        const output = [];
        for (const pokemon of pokemons) {
            output.push(this.exportPokemon(pokemon));
        }
        return output.join('\n\n');
    }

    /**
     * 导出单个宝可梦为 Showdown 格式
     */
    exportPokemon(pokemon) {
        const lines = [];

        // 第一行：昵称/名字 @ 道具
        let firstLine = '';
        if (pokemon.nickname) {
            firstLine = `${pokemon.nickname} (${pokemon.name})`;
        } else {
            firstLine = pokemon.name || 'Unknown';
        }

        if (pokemon.gender) {
            firstLine += ` (${pokemon.gender})`;
        }

        if (pokemon.item) {
            firstLine += ` @ ${pokemon.item}`;
        }

        lines.push(firstLine);

        // 特性
        if (pokemon.ability) {
            lines.push(`Ability: ${pokemon.ability}`);
        }

        // 等级
        if (pokemon.level && pokemon.level !== 100) {
            lines.push(`Level: ${pokemon.level}`);
        }

        // 闪光
        if (pokemon.shiny) {
            lines.push('Shiny: Yes');
        }

        // 太晶属性
        if (pokemon.tera_type) {
            lines.push(`Tera Type: ${pokemon.tera_type}`);
        }

        // 努力值
        const evs = pokemon.evs || [0, 0, 0, 0, 0, 0];
        const evTotal = evs.reduce((sum, ev) => sum + ev, 0);
        if (evTotal > 0) {
            const evParts = [];
            evs.forEach((ev, i) => {
                if (ev > 0) {
                    evParts.push(`${ev} ${this.statNames[i]}`);
                }
            });
            if (evParts.length > 0) {
                lines.push(`EVs: ${evParts.join(' / ')}`);
            }
        }

        // 性格
        if (pokemon.nature) {
            lines.push(`${pokemon.nature} Nature`);
        }

        // 个体值（只显示非31的）
        const ivs = pokemon.ivs || [31, 31, 31, 31, 31, 31];
        const ivParts = [];
        ivs.forEach((iv, i) => {
            if (iv !== 31) {
                ivParts.push(`${iv} ${this.statNames[i]}`);
            }
        });
        if (ivParts.length > 0) {
            lines.push(`IVs: ${ivParts.join(' / ')}`);
        }

        // 招式
        const moves = pokemon.moves || [];
        for (const move of moves) {
            if (move) {
                lines.push(`- ${move}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * 验证宝可梦配置的有效性
     */
    validatePokemon(pokemon) {
        const errors = [];

        if (!pokemon.name) {
            errors.push('宝可梦名称不能为空');
        }

        // 验证努力值总和
        const evs = pokemon.evs || [];
        if (evs.length === 6) {
            const totalEvs = evs.reduce((sum, ev) => sum + ev, 0);
            if (totalEvs > 510) {
                errors.push(`努力值总和不能超过510（当前: ${totalEvs}）`);
            }
        }

        // 验证个体值范围
        const ivs = pokemon.ivs || [];
        if (ivs.length === 6) {
            const invalidIvs = ivs.some(iv => iv < 0 || iv > 31);
            if (invalidIvs) {
                errors.push('个体值必须在0-31之间');
            }
        }

        // 验证等级
        const level = pokemon.level || 100;
        if (level < 1 || level > 100) {
            errors.push('等级必须在1-100之间');
        }

        // 验证招式数量
        const moves = pokemon.moves || [];
        if (moves.length > 4) {
            errors.push(`招式数量不能超过4个（当前: ${moves.length}）`);
        }

        return errors;
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.ShowdownParser = ShowdownParser;
}
