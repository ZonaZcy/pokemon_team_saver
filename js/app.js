/**
 * 宝可梦队伍管理器 - 主应用
 */
class TeamManagerApp {
    constructor() {
        this.teamManager = new TeamManager();
        this.showdownParser = new ShowdownParser();
        this.utils = new PokemonUtils();
        this.currentEditingTeam = null;
        this.formats = {};
        this.moves = {};
        this.abilities = {};
        this.items = {};

        this.init();
    }

    async init() {
        // 加载所有数据
        await Promise.all([
            this.utils.init(),
            this.loadFormats(),
            this.loadMoves(),
            this.loadAbilities(),
            this.loadItems()
        ]);

        // 填充格式列表
        this.populateFormatList();

        // 渲染主界面
        this.renderTeamsList();

        // 绑定事件
        this.bindEvents();
    }

    populateFormatList() {
        // 填充筛选器
        const formatFilter = document.getElementById('formatFilter');
        if (formatFilter) {
            formatFilter.innerHTML = '<option value="">所有格式</option>';
            for (const [code, name] of Object.entries(this.formats)) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                formatFilter.appendChild(option);
            }
        }

        // 填充导入对话框的datalist
        const formatList = document.getElementById('formatList');
        if (formatList) {
            formatList.innerHTML = '';
            for (const [code, name] of Object.entries(this.formats)) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                formatList.appendChild(option);
            }
        }
    }

    async loadFormats() {
        try {
            const response = await fetch('data/meta_names.json');
            this.formats = await response.json();
        } catch (error) {
            console.error('加载格式列表失败:', error);
            this.formats = {
                'gen9vgc2025regj': 'Gen 9 VGC 2025 Reg J',
                'gen9vgc2025regi': 'Gen 9 VGC 2025 Reg I',
            };
        }
    }

    async loadMoves() {
        try {
            const response = await fetch('data/moves.json');
            this.moves = await response.json();
        } catch (error) {
            console.error('加载招式数据失败:', error);
            this.moves = {};
        }
    }

    async loadAbilities() {
        try {
            const response = await fetch('data/abilities.json');
            this.abilities = await response.json();
        } catch (error) {
            console.error('加载特性数据失败:', error);
            this.abilities = {};
        }
    }

    async loadItems() {
        try {
            const response = await fetch('data/items.json');
            this.items = await response.json();
        } catch (error) {
            console.error('加载道具数据失败:', error);
            this.items = {};
        }
    }

    bindEvents() {
        // 搜索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchTeams();
                }
            });
        }

        // 格式筛选
        const formatFilter = document.getElementById('formatFilter');
        if (formatFilter) {
            formatFilter.addEventListener('change', () => this.filterTeams());
        }

        // 模态框外部点击 - 已禁用
        // window.addEventListener('click', (e) => {
        //     if (e.target.classList.contains('modal')) {
        //         e.target.classList.remove('show');
        //         e.target.style.display = 'none';
        //     }
        // });
    }

    renderTeamsList() {
        const teams = this.teamManager.listTeams();
        const stats = this.teamManager.getStatistics();
        const container = document.getElementById('teamsContainer');

        // 更新统计信息
        this.updateStatistics(stats);

        // 渲染队伍列表
        if (teams.length === 0) {
            container.innerHTML = this.renderEmptyState();
        } else {
            container.innerHTML = teams.map(([teamId, team]) =>
                this.renderTeamCard(teamId, team)
            ).join('');
        }
    }

    updateStatistics(stats) {
        const totalTeamsEl = document.getElementById('totalTeams');
        const totalPokemonsEl = document.getElementById('totalPokemons');
        const formatsCountEl = document.getElementById('formatsCount');

        if (totalTeamsEl) totalTeamsEl.textContent = stats.total_teams;
        if (totalPokemonsEl) totalPokemonsEl.textContent = stats.total_pokemons;
        if (formatsCountEl) formatsCountEl.textContent = stats.formats_count;
    }

    renderTeamCard(teamId, team) {
        const formatName = this.formats[team.format] || team.format || '未设置';
        const pokemonCount = (team.pokemons || []).length;
        const updatedDate = team.updated_at ? team.updated_at.substring(0, 10) : '';

        // 渲染宝可梦精灵图（使用sprite sheet）
        const pokemonSprites = (team.pokemons || []).slice(0, 6).map(pokemon => {
            const coords = this.utils.getPokemonSpriteCoords(pokemon.name);
            const nameCN = this.utils.translate(pokemon.name);
            return `
                <div class="pokemon-mini" title="${this.escapeHtml(nameCN)} (${this.escapeHtml(pokemon.name)})">
                    <div class="image-pokemon" style="background-position: ${coords.x}px ${coords.y}px;"></div>
                </div>
            `;
        }).join('');

        // 渲染标签
        const tags = (team.tags || []).map(tag =>
            `<span class="tag">${this.escapeHtml(tag)}</span>`
        ).join('');

        return `
            <div class="team-card" data-team-id="${teamId}" data-format="${team.format}">
                <div class="team-card-header">
                    <h3 class="team-name">${this.escapeHtml(team.name)}</h3>
                    <div class="team-meta">
                        <span class="format-badge">${formatName}</span>
                        <span class="pokemon-count">
                            <i class="fa fa-users"></i> ${pokemonCount} 只
                        </span>
                    </div>
                </div>

                ${team.description ? `
                    <div class="team-description">${this.linkifyText(team.description)}</div>
                ` : ''}

                <div class="team-pokemon-list">
                    ${pokemonSprites}
                </div>

                ${tags ? `<div class="team-tags">${tags}</div>` : ''}

                <div class="team-card-footer">
                    <div class="team-date">
                        <small>更新于: ${updatedDate}</small>
                    </div>
                    <div class="team-actions">
                        <button onclick="app.viewTeam('${teamId}')" class="button button-sm">
                            <i class="fa fa-eye"></i> 查看
                        </button>
                        <button onclick="app.editTeam('${teamId}')" class="button button-sm">
                            <i class="fa fa-edit"></i> 编辑
                        </button>
                        <button onclick="app.duplicateTeam('${teamId}')" class="button button-sm">
                            <i class="fa fa-files-o"></i> 复制
                        </button>
                        <button onclick="app.exportTeam('${teamId}')" class="button button-sm">
                            <i class="fa fa-download"></i> 导出
                        </button>
                        <button onclick="app.deleteTeam('${teamId}')" class="button button-sm button-danger">
                            <i class="fa fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fa fa-inbox" style="font-size: 64px; color: #ccc;"></i>
                <h3>还没有队伍</h3>
                <p>创建你的第一个队伍或导入现有队伍</p>
                <button onclick="app.showImportDialog()" class="button button-primary">
                    <i class="fa fa-upload"></i> 导入队伍
                </button>
            </div>
        `;
    }

    searchTeams() {
        const keyword = document.getElementById('searchInput').value;
        if (!keyword.trim()) {
            this.renderTeamsList();
            return;
        }

        const teams = this.teamManager.searchTeams(keyword);
        this.renderFilteredTeams(teams);
    }

    filterTeams() {
        const format = document.getElementById('formatFilter').value;
        if (!format) {
            this.renderTeamsList();
            return;
        }

        const teams = this.teamManager.listTeams(format);
        this.renderFilteredTeams(teams);
    }

    renderFilteredTeams(teams) {
        const container = document.getElementById('teamsContainer');
        if (teams.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>没有找到匹配的队伍</p></div>';
        } else {
            container.innerHTML = teams.map(([teamId, team]) =>
                this.renderTeamCard(teamId, team)
            ).join('');
        }
    }

    viewTeam(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            alert('队伍不存在');
            return;
        }

        // 创建详情模态框，传递 teamId
        const modal = this.createTeamViewModal(team, teamId);
        document.body.insertAdjacentHTML('beforeend', modal);

        // 显示模态框
        const modalEl = document.getElementById('teamViewModal');
        if (modalEl) {
            modalEl.classList.add('show');
            modalEl.style.display = 'block';

            // 绑定关闭事件
            modalEl.querySelector('.close-button').addEventListener('click', () => {
                modalEl.remove();
            });

            // 初始化 tooltip
            this.initTooltips(modalEl);
        }
    }

    createTeamViewModal(team, teamId) {
        const pokemonsHTML = (team.pokemons || []).map((pokemon, idx) => {
            return this.renderPokemonDetails(pokemon, idx, teamId);
        }).join('');

        const formatName = this.formats[team.format] || team.format || '未设置';

        return `
            <div id="teamViewModal" class="modal">
                <div class="modal-content team-view-modal-content">
                    <div class="modal-header">
                        <h2>${this.escapeHtml(team.name)}</h2>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="team-view-info">
                            <div>
                                <span style="color: #666; font-size: 14px;">格式：</span>
                                <span style="font-weight: bold; color: #333;">${this.escapeHtml(formatName)}</span>
                            </div>
                            <button onclick="app.editTeam('${this.escapeHtml(teamId)}')" class="button button-sm">
                                <i class="fa fa-edit"></i> 编辑队伍信息
                            </button>
                        </div>
                        ${team.description ? `<p class="team-view-description">${this.linkifyText(team.description)}</p>` : ''}
                        <div class="team-view-pokemon-grid">
                            ${pokemonsHTML}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="app.exportTeam('${this.escapeHtml(teamId)}')" class="button">
                            <i class="fa fa-download"></i> 导出
                        </button>
                        <button onclick="document.getElementById('teamViewModal').remove()" class="button">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPokemonDetails(pokemon, idx, teamId) {
        // 使用精灵图坐标
        const coords = this.utils.getPokemonSpriteCoords(pokemon.name);
        const nameCN = this.utils.translate(pokemon.name);

        // 渲染招式（翻译+属性+威力+命中率+tooltip）
        const movesHTML = (pokemon.moves || []).map(move => {
            if (!move) return '';
            const moveCN = this.utils.translate(move);
            const moveType = this.utils.getMoveType(move, this.moves);
            const moveTypeCN = moveType ? this.utils.translate(moveType) : '';
            const desc = this.utils.getMoveDesc(move, this.moves);
            const typeClass = moveType ? `type-${moveType}` : '';

            // 获取招式数据
            const moveKey = move.toLowerCase().replace(/[^a-z0-9]/g, '');
            const moveData = this.moves[moveKey] || {};
            const basePower = moveData.basePower || 0;
            const accuracy = moveData.accuracy;
            const category = moveData.category || '';
            const priority = moveData.priority || 0;

            // 威力显示（变化技能不显示威力）
            let powerDisplay = '';
            if (category === 'Physical' || category === 'Special') {
                if (basePower > 0) {
                    powerDisplay = `<span style="font-size: 11px; color: #ff6b6b; font-weight: 600;">威力:${basePower}</span>`;
                } else {
                    powerDisplay = `<span style="font-size: 11px; color: #999;">威力:—</span>`;
                }
            } else if (category === 'Status') {
                powerDisplay = `<span style="font-size: 11px; color: #a29bfe; font-weight: 500;">变化</span>`;
            }

            // 先制度显示（仅当不为0时显示）
            let priorityDisplay = '';
            if (priority !== 0) {
                const priorityColor = priority > 0 ? '#f59e0b' : '#8b5cf6';
                const prioritySign = priority > 0 ? '+' : '';
                priorityDisplay = `<span style="font-size: 11px; color: ${priorityColor}; font-weight: 600;">先制:${prioritySign}${priority}</span>`;
            }

            // 命中率显示
            let accuracyDisplay = '';
            if (accuracy === true) {
                accuracyDisplay = `<span style="font-size: 11px; color: #26de81;">必中</span>`;
            } else if (typeof accuracy === 'number') {
                accuracyDisplay = `<span style="font-size: 11px; color: #45aaf2;">命中:${accuracy}</span>`;
            }

            return `
                <div class="pokemon-move" data-tooltip="${this.escapeHtml(desc)}">
                    <span class="pokemon-move-name">${this.escapeHtml(moveCN)}</span>
                    ${moveType ? `<span class="type-badge ${typeClass}">${this.escapeHtml(moveTypeCN)}</span>` : ''}
                    <div style="display: flex; gap: 8px; margin-left: auto; align-items: center;">
                        ${powerDisplay}
                        ${priorityDisplay}
                        ${accuracyDisplay}
                    </div>
                </div>
            `;
        }).join('');

        // 特性���翻译+tooltip）
        const abilityCN = this.utils.translate(pokemon.ability);
        const abilityDesc = this.utils.getAbilityDesc(pokemon.ability, this.abilities);
        const abilityHTML = pokemon.ability ?
            `<div class="ability-display" data-tooltip="${this.escapeHtml(abilityDesc)}">
                <div>${this.escapeHtml(abilityCN)}</div>
                <div style="font-size: 11px; color: rgba(0,100,200,0.8); margin-top: 2px;">${this.escapeHtml(pokemon.ability)}</div>
            </div>` :
            '<span style="color: #999;">未设置</span>';

        // 道具（翻译+tooltip+图标）
        const itemCN = this.utils.translate(pokemon.item);
        const itemDesc = this.utils.getItemDesc(pokemon.item, this.items);
        const itemCoords = this.utils.getItemSpriteCoords(pokemon.item, this.items);
        const itemHTML = pokemon.item ?
            `<div class="item-display" data-tooltip="${this.escapeHtml(itemDesc)}">
                <div class="image-item" style="display: inline-block; background-position: ${itemCoords.x}px ${itemCoords.y}px; vertical-align: middle; margin-right: 6px;"></div>
                <div style="display: inline-block; vertical-align: middle;">
                    <div>${this.escapeHtml(itemCN)}</div>
                    <div style="font-size: 11px; color: rgba(200,100,0,0.8); margin-top: 2px;">${this.escapeHtml(pokemon.item)}</div>
                </div>
            </div>` :
            '<span style="color: #999;">无道具</span>';

        // EVs显示（显示所有值，并根据性格显示颜色）
        const evs = this.utils.formatEVs(pokemon.evs);
        const evTotal = evs.reduce((sum, ev) => sum + ev.value, 0);
        const natureModifiers = pokemon.nature ? this.utils.getNatureModifiers(pokemon.nature) : { boosted: null, reduced: null };

        // 显示所有EVs（6个属性值）
        const evsHTML = `
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-top: 6px;">
                ${evs.map((ev, statIndex) => {
                    let color = '#adb5bd';
                    let fontWeight = '500';

                    // 根据性格设置颜色：蓝色=加成，红色=减成
                    if (ev.value > 0) {
                        if (statIndex === natureModifiers.boosted) {
                            color = '#4A9EFF'; // 蓝色 - 加成
                            fontWeight = '700';
                        } else if (statIndex === natureModifiers.reduced) {
                            color = '#FF6B6B'; // 红色 - 减成
                            fontWeight = '700';
                        } else {
                            color = '#4ADE80'; // 绿色 - 有EVs但无性格影响
                            fontWeight = '600';
                        }
                    }

                    return `
                        <div style="text-align: center;">
                            <div style="font-size: 11px; color: #6c757d; font-weight: 600;">${ev.statChinese}</div>
                            <div style="font-size: 16px; font-weight: ${fontWeight}; color: ${color}; margin-top: 2px;">${ev.value}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // IVs显示（显示所有值，突出显示非31的）
        const allIvs = pokemon.ivs || [31, 31, 31, 31, 31, 31];
        const ivsHTML = `
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-top: 6px;">
                ${allIvs.map((iv, idx) => {
                    const statName = this.utils.statNamesChinese[idx];
                    const actualIv = (iv === undefined || iv === null) ? 31 : iv;
                    const color = actualIv === 31 ? '#6c757d' : '#FFA94D';
                    const fontWeight = actualIv === 31 ? '500' : '700';

                    return `
                        <div style="text-align: center;">
                            <div style="font-size: 16px; font-weight: ${fontWeight}; color: ${color};">${actualIv}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // 性格翻译和显示
        const natureCN = this.utils.translate(pokemon.nature);
        const natureHTML = pokemon.nature ? `
            <span style="font-size: 13px; color: #f8f9fa;">
                <strong>性格:</strong> ${natureCN}
            </span>
        ` : '';

        // 太晶属性圆形徽章
        const teraHTML = pokemon.tera_type ? `
            <div style="position: absolute; top: 15px; right: 15px; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);" class="type-${pokemon.tera_type}">
                <span style="font-size: 11px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${this.utils.translate(pokemon.tera_type)}</span>
            </div>
        ` : '';

        return `
            <div style="background: linear-gradient(135deg, rgba(45, 52, 84, 0.6) 0%, rgba(53, 61, 96, 0.6) 100%); border: 2px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 20px; position: relative; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
                ${teraHTML}

                <button onclick="app.editPokemon('${this.escapeHtml(teamId)}', ${idx})"
                        class="button button-sm"
                        style="position: absolute; top: 10px; left: 10px; z-index: 10;">
                    <i class="fa fa-edit"></i>
                </button>

                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                    <div class="image-pokemon" style="background-position: ${coords.x}px ${coords.y}px; transform: scale(1.8);"></div>
                    <div style="flex: 1; margin-left: 20px;">
                        <h3 style="margin: 0; font-size: 20px; color: #f8f9fa; font-weight: 700;">${this.escapeHtml(nameCN)}</h3>
                        ${pokemon.nickname ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #adb5bd; font-style: italic;">"${this.escapeHtml(pokemon.nickname)}"</p>` : ''}
                        <div style="display: flex; gap: 12px; margin-top: 6px; align-items: center; flex-wrap: wrap;">
                            ${abilityHTML}
                            ${itemHTML}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <div class="pokemon-moves">
                        ${movesHTML || '<p style="color: #6c757d; font-size: 13px;">无招式</p>'}
                    </div>
                </div>

                <div style="margin-top: 12px; padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 10px;">
                    ${natureHTML}
                    <div style="margin-top: 8px;">
                        <div style="font-size: 12px; color: #adb5bd; font-weight: 600; margin-bottom: 4px;">
                            <i class="fa fa-bar-chart"></i> EVs (努力值)
                            ${evTotal > 0 ? `<span style="margin-left: 8px; color: ${evTotal > 510 ? '#FF6B6B' : evTotal === 510 ? '#4ADE80' : '#FFA94D'};">总计: ${evTotal}/510</span>` : ''}
                        </div>
                        ${evsHTML}
                    </div>
                    <div style="margin-top: 10px;">
                        <div style="font-size: 12px; color: #adb5bd; font-weight: 600; margin-bottom: 4px;">
                            <i class="fa fa-star"></i> IVs (个体值)
                        </div>
                        ${ivsHTML}
                    </div>
                </div>
            </div>
        `;
    }

    getMoveData(moveName) {
        if (!moveName) return {};
        const key = moveName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return this.moves[key] || {};
    }

    getAbilityData(abilityName) {
        if (!abilityName) return {};
        const key = abilityName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return this.abilities[key] || {};
    }

    getItemData(itemName) {
        if (!itemName) return {};
        const key = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return this.items[key] || {};
    }

    initTooltips(container) {
        // 为所有带 data-tooltip 的元素添加 tooltip 功能
        const elements = container.querySelectorAll('[data-tooltip]');

        elements.forEach(el => {
            let tooltip = null;

            el.addEventListener('mouseenter', (e) => {
                const desc = el.getAttribute('data-tooltip');
                if (!desc) return;

                // 创建 tooltip
                tooltip = document.createElement('div');
                tooltip.className = 'tooltip show';
                tooltip.textContent = desc;
                document.body.appendChild(tooltip);

                // 初始定位在鼠标位置
                updateTooltipPosition(e);
            });

            // 鼠标移动时更新 tooltip 位置
            el.addEventListener('mousemove', (e) => {
                if (tooltip) {
                    updateTooltipPosition(e);
                }
            });

            el.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            });

            // 更新 tooltip 位置的函数
            function updateTooltipPosition(e) {
                if (!tooltip) return;

                const padding = 8; // 鼠标和 tooltip 之间的间距
                const tooltipRect = tooltip.getBoundingClientRect();

                // 默认显示在鼠标右下方
                let left = e.clientX + padding;
                let top = e.clientY + padding;

                // 如果右边超出屏幕，显示在鼠标左边
                if (left + tooltipRect.width > window.innerWidth - padding) {
                    left = e.clientX - tooltipRect.width - padding;
                }

                // 如果下方超出屏幕，显示在鼠标上方
                if (top + tooltipRect.height > window.innerHeight - padding) {
                    top = e.clientY - tooltipRect.height - padding;
                }

                // 确保不会超出左边界
                if (left < padding) {
                    left = padding;
                }

                // 确保不会超出上边界
                if (top < padding) {
                    top = padding;
                }

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
        });
    }

    deleteTeam(teamId) {
        if (!confirm('确定要删除这个队伍吗？此操作无法撤销。')) {
            return;
        }

        if (this.teamManager.deleteTeam(teamId)) {
            this.renderTeamsList();
            this.showNotification('队伍删除成功');
        } else {
            alert('删除失败');
        }
    }

    duplicateTeam(teamId) {
        const newName = prompt('请输入新队伍的名称：');
        if (!newName) return;

        const newTeamId = this.teamManager.duplicateTeam(teamId, newName);
        if (newTeamId) {
            this.renderTeamsList();
            this.showNotification('队伍复制成功');
        } else {
            alert('复制失败');
        }
    }

    editTeam(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            alert('队伍不存在');
            return;
        }

        // 创建格式选项
        const formatOptions = Object.entries(this.formats).map(([code, name]) =>
            `<option value="${code}">${this.escapeHtml(name)}</option>`
        ).join('');

        // 当前标签转换为字符串
        const tagsString = (team.tags || []).join(', ');

        const dialog = document.createElement('div');
        dialog.className = 'modal show';
        dialog.style.display = 'block';
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>编辑队伍信息</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>队伍名称 *</label>
                        <input type="text" id="editTeamName" class="textbox"
                               value="${this.escapeHtml(team.name)}" placeholder="输入队伍名称" required>
                    </div>

                    <div class="form-group">
                        <label>格式</label>
                        <input type="text" id="editTeamFormat" class="textbox" list="editFormatList"
                               value="${this.escapeHtml(team.format || '')}" placeholder="选择或输入格式名称">
                        <datalist id="editFormatList">
                            ${formatOptions}
                        </datalist>
                    </div>

                    <div class="form-group">
                        <label>描述</label>
                        <textarea id="editTeamDescription" class="textarea" rows="4"
                                  placeholder="输入队伍描述（可选）">${this.escapeHtml(team.description || '')}</textarea>
                    </div>

                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" id="editTeamTags" class="textbox"
                               value="${this.escapeHtml(tagsString)}"
                               placeholder="输入标签，用逗号分隔（例如：攻击队, VGC, 雨天队）">
                        <small style="color: #666; font-size: 12px;">提示：多个标签用逗号分隔</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="button" onclick="this.closest('.modal').remove()">取消</button>
                    <button class="button button-primary" id="saveTeamBtn">
                        <i class="fa fa-save"></i> 保存
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 绑定保存事件
        dialog.querySelector('#saveTeamBtn').addEventListener('click', () => {
            const newName = dialog.querySelector('#editTeamName').value.trim();
            const newFormat = dialog.querySelector('#editTeamFormat').value.trim();
            const newDescription = dialog.querySelector('#editTeamDescription').value.trim();
            const newTagsString = dialog.querySelector('#editTeamTags').value.trim();

            if (!newName) {
                alert('队伍名称不能为空');
                return;
            }

            // 解析标签
            const newTags = newTagsString ?
                newTagsString.split(',').map(t => t.trim()).filter(t => t) : [];

            // 准备更新数据
            const updates = {
                name: newName,
                format: newFormat,
                description: newDescription,
                tags: newTags
            };

            // 如果名称改变，需要先检查新名称是否已存在
            if (newName !== team.name) {
                const existingTeam = this.teamManager.getTeam(newName);
                if (existingTeam) {
                    alert('队伍名称已存在，请使用其他名称');
                    return;
                }
            }

            // 更新队伍
            if (this.teamManager.updateTeam(teamId, updates)) {
                dialog.remove();
                this.showNotification('队伍信息更新成功');

                // 刷新显示
                this.renderTeamsList();

                // 如果队伍详情弹窗打开，也刷新它
                const viewModal = document.getElementById('teamViewModal');
                if (viewModal) {
                    viewModal.remove();
                    // 如果名称改变了，使用新名称
                    this.viewTeam(newName !== team.name ? newName : teamId);
                }
            } else {
                alert('队伍信息更新失败');
            }
        });

        // 绑定关闭事件
        dialog.querySelector('.close-button').addEventListener('click', () => {
            dialog.remove();
        });
    }

    editTeamFormat(teamId) {
        // 保留这个方法以兼容，但现在调用完整的编辑功能
        this.editTeam(teamId);
    }

    editPokemon(teamId, pokemonIndex) {
        const team = this.teamManager.getTeam(teamId);
        if (!team || !team.pokemons || !team.pokemons[pokemonIndex]) {
            alert('宝可梦不存在');
            return;
        }

        const pokemon = team.pokemons[pokemonIndex];

        // 准备道具选项
        const itemOptions = Object.keys(this.items).map(key => {
            const item = this.items[key];
            const name = item.name || key;
            return `<option value="${this.escapeHtml(name)}">${this.escapeHtml(this.utils.translate(name))} (${this.escapeHtml(name)})</option>`;
        }).join('');

        // 准备特性选项
        const abilityOptions = Object.keys(this.abilities).map(key => {
            const ability = this.abilities[key];
            const name = ability.name || key;
            return `<option value="${this.escapeHtml(name)}">${this.escapeHtml(this.utils.translate(name))} (${this.escapeHtml(name)})</option>`;
        }).join('');

        // 准备招式选项
        const moveOptions = Object.keys(this.moves).map(key => {
            const move = this.moves[key];
            const name = move.name || key;
            return `<option value="${this.escapeHtml(name)}">${this.escapeHtml(this.utils.translate(name))} (${this.escapeHtml(name)})</option>`;
        }).join('');

        // 准备性格列表
        const natures = ['Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'];
        const natureOptions = natures.map(nature =>
            `<option value="${nature}">${this.utils.translate(nature)} (${nature})</option>`
        ).join('');

        // 准备属性列表
        const types = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy', 'Stellar'];
        const typeOptions = types.map(type =>
            `<option value="${type}">${this.utils.translate(type)} (${type})</option>`
        ).join('');

        //初始化EVs和IVs
        const evs = pokemon.evs || [0, 0, 0, 0, 0, 0];
        const ivs = pokemon.ivs || [31, 31, 31, 31, 31, 31];
        const statNames = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

        const dialog = document.createElement('div');
        dialog.className = 'modal show';
        dialog.style.display = 'block';
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>编辑宝可梦 - ${this.escapeHtml(pokemon.name)}</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>昵称</label>
                        <input type="text" id="editPokemonNickname" class="textbox"
                               value="${this.escapeHtml(pokemon.nickname || '')}" placeholder="昵称（可选）">
                    </div>

                    <div class="form-group">
                        <label>性别</label>
                        <select id="editPokemonGender" class="select">
                            <option value="">未知</option>
                            <option value="M" ${pokemon.gender === 'M' ? 'selected' : ''}>雄性 (M)</option>
                            <option value="F" ${pokemon.gender === 'F' ? 'selected' : ''}>雌性 (F)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>道具</label>
                        <input type="text" id="editPokemonItem" class="textbox" list="itemList"
                               value="${this.escapeHtml(pokemon.item || '')}" placeholder="选择或输入道具">
                        <datalist id="itemList">${itemOptions}</datalist>
                    </div>

                    <div class="form-group">
                        <label>特性</label>
                        <input type="text" id="editPokemonAbility" class="textbox" list="abilityList"
                               value="${this.escapeHtml(pokemon.ability || '')}" placeholder="选择或输入特性">
                        <datalist id="abilityList">${abilityOptions}</datalist>
                    </div>

                    <div class="form-group">
                        <label>太晶属性</label>
                        <select id="editPokemonTeraType" class="select">
                            <option value="">未设置</option>
                            ${types.map(type =>
                                `<option value="${type}" ${pokemon.tera_type === type ? 'selected' : ''}>${this.utils.translate(type)} (${type})</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>性格</label>
                        <select id="editPokemonNature" class="select">
                            <option value="">未设置</option>
                            ${natures.map(nature =>
                                `<option value="${nature}" ${pokemon.nature === nature ? 'selected' : ''}>${this.utils.translate(nature)} (${nature})</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>等级</label>
                        <input type="number" id="editPokemonLevel" class="textbox" min="1" max="100"
                               value="${pokemon.level || 50}">
                    </div>

                    <div class="form-group">
                        <label>招式（最多4个）</label>
                        ${[0, 1, 2, 3].map(i => `
                            <input type="text" id="editPokemonMove${i}" class="textbox" list="moveList"
                                   value="${this.escapeHtml((pokemon.moves && pokemon.moves[i]) || '')}"
                                   placeholder="招式 ${i + 1}" style="margin-bottom: 8px;">
                        `).join('')}
                        <datalist id="moveList">${moveOptions}</datalist>
                    </div>

                    <div class="form-group">
                        <label>努力值 (EVs) - 总计: <span id="evTotal">0</span> / 510</label>
                        ${statNames.map((stat, i) => `
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <label style="width: 60px; font-weight: bold;">${stat}:</label>
                                <input type="number" id="editPokemonEV${i}" class="textbox" min="0" max="252"
                                       value="${evs[i]}" style="flex: 1;" oninput="app.updateEVTotal()">
                            </div>
                        `).join('')}
                    </div>

                    <div class="form-group">
                        <label>个体值 (IVs) - 默认31</label>
                        ${statNames.map((stat, i) => `
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <label style="width: 60px; font-weight: bold;">${stat}:</label>
                                <input type="number" id="editPokemonIV${i}" class="textbox" min="0" max="31"
                                       value="${ivs[i]}" style="flex: 1;">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="button" onclick="this.closest('.modal').remove()">取消</button>
                    <button class="button button-primary" id="savePokemonBtn">
                        <i class="fa fa-save"></i> 保存
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 更新EV总计
        this.updateEVTotal();

        // 绑定保存事件
        dialog.querySelector('#savePokemonBtn').addEventListener('click', () => {
            // 收集表单数据
            const updatedPokemon = {
                ...pokemon,
                nickname: dialog.querySelector('#editPokemonNickname').value.trim(),
                gender: dialog.querySelector('#editPokemonGender').value,
                item: dialog.querySelector('#editPokemonItem').value.trim(),
                ability: dialog.querySelector('#editPokemonAbility').value.trim(),
                tera_type: dialog.querySelector('#editPokemonTeraType').value,
                nature: dialog.querySelector('#editPokemonNature').value,
                level: parseInt(dialog.querySelector('#editPokemonLevel').value) || 50,
                moves: [0, 1, 2, 3].map(i =>
                    dialog.querySelector(`#editPokemonMove${i}`).value.trim()
                ).filter(m => m),
                evs: [0, 1, 2, 3, 4, 5].map(i =>
                    parseInt(dialog.querySelector(`#editPokemonEV${i}`).value) || 0
                ),
                ivs: [0, 1, 2, 3, 4, 5].map(i =>
                    parseInt(dialog.querySelector(`#editPokemonIV${i}`).value) || 31
                )
            };

            // 更新队伍中的宝可梦
            const updatedPokemons = [...team.pokemons];
            updatedPokemons[pokemonIndex] = updatedPokemon;

            if (this.teamManager.updateTeam(teamId, { pokemons: updatedPokemons })) {
                dialog.remove();
                this.showNotification('宝可梦信息更新成功');

                // 刷新详情页
                const viewModal = document.getElementById('teamViewModal');
                if (viewModal) {
                    viewModal.remove();
                    this.viewTeam(teamId);
                }
            } else {
                alert('宝可梦信息更新失败');
            }
        });

        // 绑定关闭事件
        dialog.querySelector('.close-button').addEventListener('click', () => {
            dialog.remove();
        });
    }

    updateEVTotal() {
        const total = [0, 1, 2, 3, 4, 5].reduce((sum, i) => {
            const input = document.querySelector(`#editPokemonEV${i}`);
            return sum + (input ? (parseInt(input.value) || 0) : 0);
        }, 0);
        const totalEl = document.getElementById('evTotal');
        if (totalEl) {
            totalEl.textContent = total;
            totalEl.style.color = total > 510 ? '#f44336' : total === 510 ? '#4caf50' : '#666';
        }
    }

    exportTeam(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            alert('队伍不存在');
            return;
        }

        const showdownText = this.showdownParser.exportTeam(team.pokemons || []);
        this.copyToClipboard(showdownText);
        this.showNotification('队伍已复制到剪贴板');
    }

    showImportDialog() {
        const modal = document.getElementById('importDialog');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'block';
        }
    }

    closeImportDialog() {
        const modal = document.getElementById('importDialog');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    importTeam() {
        const name = document.getElementById('importTeamName').value || '导入的队伍';
        const format = document.getElementById('importTeamFormat').value;
        const showdownText = document.getElementById('importTeamText').value;

        if (!showdownText.trim()) {
            alert('请粘贴队伍数据');
            return;
        }

        try {
            const pokemons = this.showdownParser.parseTeam(showdownText);
            if (pokemons.length === 0) {
                alert('没有解析到任何宝可梦');
                return;
            }

            this.teamManager.createTeam(name, format, '', pokemons, []);
            this.closeImportDialog();
            this.renderTeamsList();
            this.showNotification(`导入成功！共导入 ${pokemons.length} 只宝可梦`);

            // 清空表单
            document.getElementById('importTeamName').value = '';
            document.getElementById('importTeamFormat').value = '';
            document.getElementById('importTeamText').value = '';
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败：' + error.message);
        }
    }

    exportAllTeams() {
        const backup = this.teamManager.exportBackup();
        const blob = new Blob([backup], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pokemon-teams-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('备份已下载');
    }

    async showCloudLibrary() {
        const modal = document.getElementById('cloudLibraryDialog');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'block';

            // 加载云端队伍
            await this.loadCloudTeams();
        }
    }

    closeCloudLibrary() {
        const modal = document.getElementById('cloudLibraryDialog');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    async loadCloudTeams() {
        const container = document.getElementById('cloudTeamsContainer');

        try {
            // 从静态文件读取队伍列表
            const response = await fetch('cloud-teams/index.json');
            if (!response.ok) {
                throw new Error('无法加载云端队伍列表');
            }

            const teamsIndex = await response.json();

            if (teamsIndex.length === 0) {
                container.className = ''; // 移除 loading 类
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa fa-cloud" style="font-size: 64px; color: #ccc;"></i>
                        <h3>云端还没有队伍</h3>
                        <p>云端队伍库为空</p>
                    </div>
                `;
                return;
            }

            // 加载每个队伍的完整数据
            const teamsPromises = teamsIndex.map(async (teamInfo) => {
                try {
                    const teamResponse = await fetch(`cloud-teams/${teamInfo.filename}`);
                    if (teamResponse.ok) {
                        const teamData = await teamResponse.json();
                        return { ...teamData, filename: teamInfo.filename };
                    }
                } catch (error) {
                    console.error(`Failed to load ${teamInfo.filename}:`, error);
                }
                return null;
            });

            const teams = (await Promise.all(teamsPromises)).filter(t => t !== null);

            if (teams.length === 0) {
                container.className = ''; // 移除 loading 类
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa fa-exclamation-circle" style="font-size: 64px; color: #ff6b6b;"></i>
                        <h3>加载失败</h3>
                        <p>无法加载任何队伍数据</p>
                    </div>
                `;
                return;
            }

            // 渲染云端队伍列表
            container.className = ''; // 移除 loading 类
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 24px;">
                    ${teams.map(team => this.renderCloudTeamCard(team)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('加载云端队伍失败:', error);
            container.className = ''; // 移除 loading 类
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-exclamation-circle" style="font-size: 64px; color: #ff6b6b;"></i>
                    <h3>加载失败</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 13px; color: #999; margin-top: 12px;">
                        请确保 cloud-teams/index.json 文件存在
                    </p>
                </div>
            `;
        }
    }

    renderCloudTeamCard(team) {
        const formatName = this.formats[team.format] || team.format || '未设置';
        const pokemonCount = (team.pokemons || []).length;
        const updatedDate = team.updated_at ? team.updated_at.substring(0, 10) : '';

        // 渲染宝可梦精灵图
        const pokemonSprites = (team.pokemons || []).slice(0, 6).map(pokemon => {
            const coords = this.utils.getPokemonSpriteCoords(pokemon.name);
            const nameCN = this.utils.translate(pokemon.name);
            return `
                <div class="pokemon-mini" title="${this.escapeHtml(nameCN)} (${this.escapeHtml(pokemon.name)})">
                    <div class="image-pokemon" style="background-position: ${coords.x}px ${coords.y}px;"></div>
                </div>
            `;
        }).join('');

        // 渲染标签
        const tags = (team.tags || []).map(tag =>
            `<span class="tag">${this.escapeHtml(tag)}</span>`
        ).join('');

        return `
            <div class="team-card" data-format="${team.format}">
                <div class="team-card-header">
                    <h3 class="team-name">${this.escapeHtml(team.name)}</h3>
                    <div class="team-meta">
                        <span class="format-badge">${formatName}</span>
                        <span class="pokemon-count">
                            <i class="fa fa-users"></i> ${pokemonCount} 只
                        </span>
                    </div>
                </div>

                ${team.description ? `
                    <div class="team-description">${this.linkifyText(team.description)}</div>
                ` : ''}

                <div class="team-pokemon-list">
                    ${pokemonSprites}
                </div>

                ${tags ? `<div class="team-tags">${tags}</div>` : ''}

                <div class="team-card-footer">
                    <div class="team-date">
                        <small>云端队伍 | 更新于: ${updatedDate}</small>
                    </div>
                    <div class="team-actions">
                        <button onclick="app.viewCloudTeam('${this.escapeHtml(team.filename)}')" class="button button-sm">
                            <i class="fa fa-eye"></i> 查看
                        </button>
                        <button onclick="app.importCloudTeam('${this.escapeHtml(team.filename)}')" class="button button-sm button-primary">
                            <i class="fa fa-download"></i> 导入
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async importCloudTeam(filename) {
        try {
            // 从静态文件读取队伍详情
            const response = await fetch(`cloud-teams/${filename}`);
            if (!response.ok) {
                throw new Error('无法获取队伍数据');
            }

            const teamData = await response.json();

            // 检查是否已存在同名队伍
            let teamName = teamData.name;
            let counter = 1;
            while (this.teamManager.getTeam(teamName)) {
                teamName = `${teamData.name} (${counter})`;
                counter++;
            }

            // 导入队伍
            this.teamManager.createTeam(
                teamName,
                teamData.format,
                teamData.description || '',
                teamData.pokemons || [],
                teamData.tags || []
            );

            this.closeCloudLibrary();
            this.renderTeamsList();
            this.showNotification(`队伍 "${teamName}" 已导入到本地`);
        } catch (error) {
            console.error('导入云端队伍失败:', error);
            alert('导入失败：' + error.message);
        }
    }

    async viewCloudTeam(filename) {
        try {
            // 从静态文件读取队伍详情
            const response = await fetch(`cloud-teams/${filename}`);
            if (!response.ok) {
                throw new Error('无法获取队伍数据');
            }

            const teamData = await response.json();

            // 创建只读查看模态框（不显示编辑按钮）
            const modal = this.createCloudTeamViewModal(teamData, filename);
            document.body.insertAdjacentHTML('beforeend', modal);

            const modalEl = document.getElementById('teamViewModal');
            if (modalEl) {
                modalEl.classList.add('show');
                modalEl.style.display = 'block';

                modalEl.querySelector('.close-button').addEventListener('click', () => {
                    modalEl.remove();
                });

                this.initTooltips(modalEl);
            }
        } catch (error) {
            console.error('查看云端队伍失败:', error);
            alert('加载失败：' + error.message);
        }
    }

    createCloudTeamViewModal(team, filename) {
        // 与createTeamViewModal类似，但移除编辑按钮
        const pokemonsHTML = (team.pokemons || []).map((pokemon, idx) => {
            return this.renderCloudPokemonDetails(pokemon, idx);
        }).join('');

        const formatName = this.formats[team.format] || team.format || '未设置';

        return `
            <div id="teamViewModal" class="modal">
                <div class="modal-content team-view-modal-content">
                    <div class="modal-header">
                        <h2><i class="fa fa-cloud"></i> ${this.escapeHtml(team.name)} (云端队伍)</h2>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="team-view-info">
                            <div>
                                <span style="color: #666; font-size: 14px;">格式：</span>
                                <span style="font-weight: bold; color: #333;">${this.escapeHtml(formatName)}</span>
                            </div>
                            <button onclick="app.importCloudTeam('${this.escapeHtml(filename)}')" class="button button-sm button-primary">
                                <i class="fa fa-download"></i> 导入到本地
                            </button>
                        </div>
                        ${team.description ? `<p class="team-view-description">${this.linkifyText(team.description)}</p>` : ''}
                        <div class="team-view-pokemon-grid">
                            ${pokemonsHTML}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="const text = app.showdownParser.exportTeam(${JSON.stringify(team.pokemons || [])}); app.copyToClipboard(text); app.showNotification('队伍已复制到剪贴板')" class="button">
                            <i class="fa fa-download"></i> 导出
                        </button>
                        <button onclick="document.getElementById('teamViewModal').remove()" class="button">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCloudPokemonDetails(pokemon, idx) {
        // 与renderPokemonDetails类似，但移除编辑按钮
        const coords = this.utils.getPokemonSpriteCoords(pokemon.name);
        const nameCN = this.utils.translate(pokemon.name);

        // 渲染招式
        const movesHTML = (pokemon.moves || []).map(move => {
            if (!move) return '';
            const moveCN = this.utils.translate(move);
            const moveType = this.utils.getMoveType(move, this.moves);
            const moveTypeCN = moveType ? this.utils.translate(moveType) : '';
            const desc = this.utils.getMoveDesc(move, this.moves);
            const typeClass = moveType ? `type-${moveType}` : '';

            const moveKey = move.toLowerCase().replace(/[^a-z0-9]/g, '');
            const moveData = this.moves[moveKey] || {};
            const basePower = moveData.basePower || 0;
            const accuracy = moveData.accuracy;
            const category = moveData.category || '';
            const priority = moveData.priority || 0;

            let powerDisplay = '';
            if (category === 'Physical' || category === 'Special') {
                if (basePower > 0) {
                    powerDisplay = `<span style="font-size: 11px; color: #ff6b6b; font-weight: 600;">威力:${basePower}</span>`;
                } else {
                    powerDisplay = `<span style="font-size: 11px; color: #999;">威力:—</span>`;
                }
            } else if (category === 'Status') {
                powerDisplay = `<span style="font-size: 11px; color: #a29bfe; font-weight: 500;">变化</span>`;
            }

            // 先制度显示（仅当不为0时显示）
            let priorityDisplay = '';
            if (priority !== 0) {
                const priorityColor = priority > 0 ? '#f59e0b' : '#8b5cf6';
                const prioritySign = priority > 0 ? '+' : '';
                priorityDisplay = `<span style="font-size: 11px; color: ${priorityColor}; font-weight: 600;">先制:${prioritySign}${priority}</span>`;
            }

            let accuracyDisplay = '';
            if (accuracy === true) {
                accuracyDisplay = `<span style="font-size: 11px; color: #26de81;">必中</span>`;
            } else if (typeof accuracy === 'number') {
                accuracyDisplay = `<span style="font-size: 11px; color: #45aaf2;">命中:${accuracy}</span>`;
            }

            return `
                <div class="pokemon-move" data-tooltip="${this.escapeHtml(desc)}">
                    <span class="pokemon-move-name">${this.escapeHtml(moveCN)}</span>
                    ${moveType ? `<span class="type-badge ${typeClass}">${this.escapeHtml(moveTypeCN)}</span>` : ''}
                    <div style="display: flex; gap: 8px; margin-left: auto; align-items: center;">
                        ${powerDisplay}
                        ${priorityDisplay}
                        ${accuracyDisplay}
                    </div>
                </div>
            `;
        }).join('');

        const abilityCN = this.utils.translate(pokemon.ability);
        const abilityDesc = this.utils.getAbilityDesc(pokemon.ability, this.abilities);
        const abilityHTML = pokemon.ability ?
            `<div class="ability-display" data-tooltip="${this.escapeHtml(abilityDesc)}">
                <div>${this.escapeHtml(abilityCN)}</div>
                <div style="font-size: 11px; color: rgba(0,100,200,0.8); margin-top: 2px;">${this.escapeHtml(pokemon.ability)}</div>
            </div>` :
            '<span style="color: #999;">未设置</span>';

        const itemCN = this.utils.translate(pokemon.item);
        const itemDesc = this.utils.getItemDesc(pokemon.item, this.items);
        const itemCoords = this.utils.getItemSpriteCoords(pokemon.item, this.items);
        const itemHTML = pokemon.item ?
            `<div class="item-display" data-tooltip="${this.escapeHtml(itemDesc)}">
                <div class="image-item" style="display: inline-block; background-position: ${itemCoords.x}px ${itemCoords.y}px; vertical-align: middle; margin-right: 6px;"></div>
                <div style="display: inline-block; vertical-align: middle;">
                    <div>${this.escapeHtml(itemCN)}</div>
                    <div style="font-size: 11px; color: rgba(200,100,0,0.8); margin-top: 2px;">${this.escapeHtml(pokemon.item)}</div>
                </div>
            </div>` :
            '<span style="color: #999;">无道具</span>';

        const evs = this.utils.formatEVs(pokemon.evs);
        const evTotal = evs.reduce((sum, ev) => sum + ev.value, 0);
        const natureModifiers = pokemon.nature ? this.utils.getNatureModifiers(pokemon.nature) : { boosted: null, reduced: null };

        // 显示所有EVs（6个属性值）
        const evsHTML = `
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-top: 6px;">
                ${evs.map((ev, statIndex) => {
                    let color = '#adb5bd';
                    let fontWeight = '500';

                    // 根据性格设置颜色：蓝色=加成，红色=减成
                    if (ev.value > 0) {
                        if (statIndex === natureModifiers.boosted) {
                            color = '#4A9EFF'; // 蓝色 - 加成
                            fontWeight = '700';
                        } else if (statIndex === natureModifiers.reduced) {
                            color = '#FF6B6B'; // 红色 - 减成
                            fontWeight = '700';
                        } else {
                            color = '#4ADE80'; // 绿色 - 有EVs但无性格影响
                            fontWeight = '600';
                        }
                    }

                    return `
                        <div style="text-align: center;">
                            <div style="font-size: 11px; color: #6c757d; font-weight: 600;">${ev.statChinese}</div>
                            <div style="font-size: 16px; font-weight: ${fontWeight}; color: ${color}; margin-top: 2px;">${ev.value}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // IVs显示（显示所有值，突出显示非31的）
        const allIvs = pokemon.ivs || [31, 31, 31, 31, 31, 31];
        const ivsHTML = `
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-top: 6px;">
                ${allIvs.map((iv, idx) => {
                    const statName = this.utils.statNamesChinese[idx];
                    const actualIv = (iv === undefined || iv === null) ? 31 : iv;
                    const color = actualIv === 31 ? '#6c757d' : '#FFA94D';
                    const fontWeight = actualIv === 31 ? '500' : '700';

                    return `
                        <div style="text-align: center;">
                            <div style="font-size: 16px; font-weight: ${fontWeight}; color: ${color};">${actualIv}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        const natureCN = this.utils.translate(pokemon.nature);

        return `
            <div style="background: linear-gradient(135deg, rgba(45, 52, 84, 0.6) 0%, rgba(53, 61, 96, 0.6) 100%); border: 2px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                    <div class="image-pokemon" style="background-position: ${coords.x}px ${coords.y}px;"></div>
                    <div>
                        <h3 style="margin: 0; font-size: 18px; color: #f8f9fa;">${this.escapeHtml(nameCN)}</h3>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #adb5bd;">${this.escapeHtml(pokemon.name)}</p>
                        ${pokemon.nickname ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #adb5bd; font-style: italic;">"${this.escapeHtml(pokemon.nickname)}"</p>` : ''}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label style="font-size: 12px; color: #adb5bd; font-weight: bold;">特性</label>
                        <div>${abilityHTML}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #adb5bd; font-weight: bold;">道具</label>
                        <div>${itemHTML}</div>
                    </div>
                </div>

                <div>
                    <label style="font-size: 12px; color: #adb5bd; font-weight: bold; display: block; margin-bottom: 6px;">招式</label>
                    <div class="pokemon-moves">
                        ${movesHTML || '<p style="color: #6c757d; font-size: 13px;">无招式</p>'}
                    </div>
                </div>

                ${evsHTML}
                ${ivsHTML}

                ${pokemon.nature ? `<p style="margin-top: 10px; font-size: 13px; color: #f8f9fa;">
                    <strong>性格:</strong> ${natureCN}
                    <span style="color: #adb5bd;">(${pokemon.nature})</span>
                </p>` : ''}

                ${pokemon.tera_type ? `<p style="margin-top: 8px; font-size: 13px; color: #f8f9fa;">
                    <strong>太晶属性:</strong> <span class="type-badge type-${pokemon.tera_type}">${this.utils.translate(pokemon.tera_type)}</span>
                </p>` : ''}
            </div>
        `;
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
    }

    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    showNotification(message) {
        // 简单的通知实现
        alert(message);
    }

    getPokemonSpriteName(name) {
        if (!name) return 'substitute';
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '')
            .replace(/^(\d)/, '_$1'); // 数字开头的加下划线
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 将文本中的URL转换为可点击的链接
     */
    linkifyText(text) {
        if (!text) return '';
        // 先转义HTML
        const escaped = this.escapeHtml(text);
        // URL正则表达式
        const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
        // 替换URL为链接
        return escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #2196f3; text-decoration: underline;">$1</a>');
    }
}

// 应用初始化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TeamManagerApp();
});
