/**
 * 队伍管理器 - 使用 localStorage 进行数据持久化
 */
class TeamManager {
    constructor() {
        this.storageKey = 'pokemon_teams';
        this.teams = this.loadTeams();
    }

    /**
     * 从 localStorage 加载所有队伍
     */
    loadTeams() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('加载队伍失败:', error);
            return {};
        }
    }

    /**
     * 保存所有队伍到 localStorage
     */
    saveTeams() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.teams));
        } catch (error) {
            console.error('保存队伍失败:', error);
        }
    }

    /**
     * 创建新队伍
     */
    createTeam(name, formatCode = '', description = '', pokemons = [], tags = []) {
        // 生成唯一ID
        let teamId = name;
        let counter = 1;
        while (this.teams[teamId]) {
            teamId = `${name}_${counter}`;
            counter++;
        }

        const now = new Date().toISOString();
        this.teams[teamId] = {
            name,
            format: formatCode,
            description,
            pokemons,
            tags,
            created_at: now,
            updated_at: now
        };

        this.saveTeams();
        return teamId;
    }

    /**
     * 获取指定队伍
     */
    getTeam(teamId) {
        return this.teams[teamId] || null;
    }

    /**
     * 更新队伍信息
     */
    updateTeam(teamId, updates) {
        if (!this.teams[teamId]) {
            return false;
        }

        const allowedFields = ['name', 'format', 'description', 'pokemons', 'tags'];
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                this.teams[teamId][key] = value;
            }
        }

        this.teams[teamId].updated_at = new Date().toISOString();
        this.saveTeams();
        return true;
    }

    /**
     * 删除队伍
     */
    deleteTeam(teamId) {
        if (this.teams[teamId]) {
            delete this.teams[teamId];
            this.saveTeams();
            return true;
        }
        return false;
    }

    /**
     * 列出所有队伍
     */
    listTeams(formatCode = null, tags = null, sortBy = 'updated_at', reverse = true) {
        let result = [];

        for (const [teamId, team] of Object.entries(this.teams)) {
            // 格式筛选
            if (formatCode && team.format !== formatCode) {
                continue;
            }

            // 标签筛选
            if (tags && tags.length > 0) {
                const teamTags = new Set(team.tags || []);
                const hasMatchingTag = tags.some(tag => teamTags.has(tag));
                if (!hasMatchingTag) {
                    continue;
                }
            }

            result.push([teamId, team]);
        }

        // 排序
        if (['created_at', 'updated_at', 'name'].includes(sortBy)) {
            result.sort((a, b) => {
                const valA = a[1][sortBy] || '';
                const valB = b[1][sortBy] || '';
                return reverse ? valB.localeCompare(valA) : valA.localeCompare(valB);
            });
        }

        return result;
    }

    /**
     * 搜索队伍
     */
    searchTeams(keyword) {
        keyword = keyword.toLowerCase();
        const result = [];

        for (const [teamId, team] of Object.entries(this.teams)) {
            // 在名称中搜索
            if (team.name && team.name.toLowerCase().includes(keyword)) {
                result.push([teamId, team]);
                continue;
            }

            // 在描述中搜索
            if (team.description && team.description.toLowerCase().includes(keyword)) {
                result.push([teamId, team]);
                continue;
            }

            // 在标签中搜索
            if (team.tags && team.tags.some(tag => tag.toLowerCase().includes(keyword))) {
                result.push([teamId, team]);
                continue;
            }

            // 在宝可梦名称中搜索
            if (team.pokemons && team.pokemons.some(p =>
                (p.name && p.name.toLowerCase().includes(keyword)) ||
                (p.nickname && p.nickname.toLowerCase().includes(keyword))
            )) {
                result.push([teamId, team]);
            }
        }

        return result;
    }

    /**
     * 根据宝可梦查找队伍
     */
    getTeamsByPokemon(pokemonName) {
        const result = [];
        const searchName = pokemonName.toLowerCase();

        for (const [teamId, team] of Object.entries(this.teams)) {
            if (team.pokemons && team.pokemons.some(p =>
                p.name && p.name.toLowerCase().includes(searchName)
            )) {
                result.push([teamId, team]);
            }
        }

        return result;
    }

    /**
     * 复制队伍
     */
    duplicateTeam(teamId, newName = null) {
        if (!this.teams[teamId]) {
            return null;
        }

        const originalTeam = this.teams[teamId];
        const teamName = newName || `${originalTeam.name} (副本)`;

        return this.createTeam(
            teamName,
            originalTeam.format || '',
            originalTeam.description || '',
            JSON.parse(JSON.stringify(originalTeam.pokemons || [])),
            [...(originalTeam.tags || [])]
        );
    }

    /**
     * 验证队伍数据的有效性
     */
    validateTeam(teamId) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!this.teams[teamId]) {
            result.valid = false;
            result.errors.push('队伍不存在');
            return result;
        }

        const team = this.teams[teamId];
        const pokemons = team.pokemons || [];

        // 验证宝可梦数量
        if (pokemons.length === 0) {
            result.warnings.push('队伍中没有宝可梦');
        } else if (pokemons.length > 6) {
            result.valid = false;
            result.errors.push(`队伍中有 ${pokemons.length} 只宝可梦，超过上限 6 只`);
        }

        // 检查重复的宝可梦
        const pokemonNames = new Set();
        for (const pokemon of pokemons) {
            if (pokemon.name) {
                if (pokemonNames.has(pokemon.name)) {
                    result.warnings.push(`队伍中有重复的宝可梦: ${pokemon.name}`);
                }
                pokemonNames.add(pokemon.name);
            }
        }

        // 验证每只宝可梦
        for (let i = 0; i < pokemons.length; i++) {
            const pokemon = pokemons[i];
            const prefix = `宝可梦 #${i + 1}`;

            // 验证名称
            if (!pokemon.name) {
                result.valid = false;
                result.errors.push(`${prefix}: 缺少宝可梦名称`);
                continue;
            }

            // 验证努力值总和
            if (pokemon.evs) {
                const evTotal = Object.values(pokemon.evs).reduce((sum, val) => sum + (val || 0), 0);
                if (evTotal > 510) {
                    result.valid = false;
                    result.errors.push(`${prefix} (${pokemon.name}): 努力值总和为 ${evTotal}，超过上限 510`);
                }
            }

            // 验证招式数量
            if (pokemon.moves && pokemon.moves.length > 4) {
                result.valid = false;
                result.errors.push(`${prefix} (${pokemon.name}): 有 ${pokemon.moves.length} 个招式，超过上限 4 个`);
            }
        }

        return result;
    }

    /**
     * 获取基本统计信息
     */
    getStatistics() {
        let totalPokemons = 0;
        const formats = new Set();

        for (const team of Object.values(this.teams)) {
            if (team.format) formats.add(team.format);
            totalPokemons += (team.pokemons || []).length;
        }

        return {
            total_teams: Object.keys(this.teams).length,
            total_pokemons: totalPokemons,
            formats_count: formats.size
        };
    }

    /**
     * 导出所有队伍为 JSON
     */
    exportBackup() {
        return JSON.stringify(this.teams, null, 2);
    }

    /**
     * 导入备份数据
     */
    importBackup(backupData) {
        try {
            let data;
            if (typeof backupData === 'string') {
                data = JSON.parse(backupData);
            } else {
                data = backupData;
            }

            // 验证数据格式
            if (typeof data !== 'object' || data === null) {
                throw new Error('无效的备份数据格式');
            }

            // 合并数据（避免覆盖现有队伍）
            let importCount = 0;
            for (const [teamId, team] of Object.entries(data)) {
                // 如果队伍ID已存在，生成新ID
                let newTeamId = teamId;
                let counter = 1;
                while (this.teams[newTeamId]) {
                    newTeamId = `${teamId}_imported_${counter}`;
                    counter++;
                }

                this.teams[newTeamId] = team;
                importCount++;
            }

            this.saveTeams();
            return { success: true, count: importCount };
        } catch (error) {
            console.error('导入失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.TeamManager = TeamManager;
}
