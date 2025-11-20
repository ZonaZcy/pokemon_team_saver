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
        // 初始化 Toast 容器
        this.initToastContainer();

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

        // 绑定键盘事件
        this.bindKeyboardEvents();

        // 初始化UI特效（滚动进度条、波纹效果）
        this.initUIEffects();

        // 初始化 Konami Code 彩蛋
        this.initKonamiCode();
    }

    initToastContainer() {
        // 在 HTML body 底部插入容器（如果不存在）
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // 图标映射
        const icons = {
            info: '<i class="fa fa-info-circle"></i>',
            success: '<i class="fa fa-check-circle"></i>',
            error: '<i class="fa fa-times-circle"></i>',
            warning: '<i class="fa fa-exclamation-triangle"></i>'
        };

        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span>${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // 强制重绘以触发 CSS transition
        toast.offsetHeight;
        toast.classList.add('show');

        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.remove('show');
            // 等待动画结束后从 DOM 移除
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    bindKeyboardEvents() {
        // ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
                // 查找当前可见的模态框
                const visibleModal = document.querySelector('.modal.show');
                if (visibleModal) {
                    const closeButton = visibleModal.querySelector('.close-button');
                    if (closeButton) {
                        closeButton.click();
                    } else {
                        // 如果没有关闭按钮，直接移除模态框
                        visibleModal.classList.remove('show');
                        visibleModal.style.display = 'none';
                        if (visibleModal.id !== 'importDialog' && visibleModal.id !== 'cloudLibraryDialog') {
                            visibleModal.remove();
                        }
                    }
                }
            }
        });

        // EVs 输入限制 (0-252)
        document.addEventListener('input', (e) => {
            if (e.target.id && e.target.id.startsWith('editPokemonEV')) {
                let val = e.target.value;
                // 移除非数字字符
                val = val.replace(/[^0-9]/g, '');

                // 转换为数字并限制范围
                if (val !== '') {
                    let num = parseInt(val, 10);
                    if (num > 252) num = 252;
                    if (num < 0) num = 0;

                    if (e.target.value != num.toString()) {
                        e.target.value = num;
                    }
                }

                // 触发EV总计更新
                this.updateEVTotal();
            }
        });

        // IVs 输入限制 (0-31)
        document.addEventListener('input', (e) => {
            if (e.target.id && e.target.id.startsWith('editPokemonIV')) {
                let val = e.target.value;
                val = val.replace(/[^0-9]/g, '');

                if (val !== '') {
                    let num = parseInt(val, 10);
                    if (num > 31) num = 31;
                    if (num < 0) num = 0;

                    if (e.target.value != num.toString()) {
                        e.target.value = num;
                    }
                }
            }
        });

        // 等级输入限制 (1-100)
        document.addEventListener('input', (e) => {
            if (e.target.id === 'editPokemonLevel') {
                let val = e.target.value;
                val = val.replace(/[^0-9]/g, '');

                if (val !== '') {
                    let num = parseInt(val, 10);
                    if (num > 100) num = 100;
                    if (num < 1) num = 1;

                    if (e.target.value != num.toString()) {
                        e.target.value = num;
                    }
                }
            }
        });
    }

    /**
     * 初始化UI特效：滚动进度条和波纹效果
     */
    initUIEffects() {
        // --- 1. 页面滚动进度条 ---
        $(window).on('scroll', () => {
            const scrollTop = $(window).scrollTop();
            const docHeight = $(document).height();
            const winHeight = $(window).height();

            // 防止分母为0
            const scrollPercent = (docHeight - winHeight) <= 0 ? 0 : (scrollTop / (docHeight - winHeight)) * 100;

            $('#scroll-progress-bar').css('width', scrollPercent + '%');
        });

        // --- 2. 按钮波纹效果 ---
        // 使用事件委托，确保动态生成的按钮也有效果
        $(document).on('click', 'button, .btn, .team-card', function(e) {
            const $btn = $(this);

            // 创建波纹元素
            const $ripple = $('<span class="ripple-effect"></span>');

            // 计算点击位置
            const offset = $btn.offset();
            const x = e.pageX - offset.left;
            const y = e.pageY - offset.top;

            // 设置大小（取宽高的最大值，确保覆盖）
            const size = Math.max($btn.outerWidth(), $btn.outerHeight());

            $ripple.css({
                top: y - size / 2 + 'px',
                left: x - size / 2 + 'px',
                width: size + 'px',
                height: size + 'px'
            });

            // 添加到按钮并自动移除
            $btn.append($ripple);

            // 动画结束后移除 DOM
            setTimeout(() => {
                $ripple.remove();
            }, 600);
        });

        // --- 3. 3D 视差卡片效果 ---
        this.init3DParallax();
    }

    /**
     * 3D 视差效果 - Apple TV 风格
     */
    init3DParallax() {
        // 使用事件委托处理动态生成的卡片
        $(document).on('mousemove', '.team-card', function(e) {
            const $card = $(this);
            const width = $card.outerWidth();
            const height = $card.outerHeight();

            // 计算鼠标在卡片内的相对坐标
            const offset = $card.offset();
            const x = e.pageX - offset.left;
            const y = e.pageY - offset.top;

            // 计算旋转角度 (范围: -10deg 到 10deg)
            // X轴：鼠标在上方，卡片向上倾斜（正旋转）
            // Y轴：鼠标在右侧，卡片向右倾斜（正旋转）
            const rotateY = ((x / width) * 20 - 10).toFixed(2);
            const rotateX = (-(y / height) * 20 + 10).toFixed(2);

            // 设置光泽层位置
            let $glare = $card.find('.card-glare');
            if ($glare.length === 0) {
                $card.append('<div class="card-glare"></div>');
                $glare = $card.find('.card-glare');
            }

            // 光泽跟随鼠标移动
            $glare.css({
                'background': `radial-gradient(circle at ${(x / width * 100).toFixed(0)}% ${(y / height * 100).toFixed(0)}%, rgba(255, 255, 255, 0.3), transparent 60%)`,
                'opacity': '1'
            });

            // 应用 3D 变换
            $card.css('transform', `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`);
        });

        // 鼠标离开时复位
        $(document).on('mouseleave', '.team-card', function() {
            const $card = $(this);
            $card.css('transform', 'perspective(1000px) rotateX(0) rotateY(0) scale(1)');
            $card.find('.card-glare').css('opacity', '0');
        });
    }

    /**
     * 数字滚动动画
     */
    animateNumber($element, finalValue) {
        // 获取当前显示的数值，如果没有则默认为0
        const startValue = parseInt($element.text()) || 0;

        // 如果数值没变，不执行动画
        if (startValue === finalValue) return;

        // 使用 jQuery 的 animate 方法来平滑过渡数值
        $({ val: startValue }).animate({ val: finalValue }, {
            duration: 1500, // 1.5秒完成
            easing: 'swing', // 缓动效果
            step: function() {
                // 每一步更新文本
                $element.text(Math.floor(this.val));
            },
            complete: function() {
                // 确保最终数值准确
                $element.text(finalValue);
            }
        });
    }

    renderSkeletons(count = 6) {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 24px;">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton-pulse sk-title"></div>
                    <div class="skeleton-pulse sk-tags"></div>
                    <div class="sk-mons-row">
                        ${'<div class="skeleton-pulse sk-mon"></div>'.repeat(6)}
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return html;
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
        // 搜索 - 添加实时聚光灯效果
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // 保留原有的回车搜索
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchTeams();
                }
            });

            // 添加实时聚光灯效果
            searchInput.addEventListener('input', (e) => {
                this.applySpotlightSearch(e.target.value);
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

            // 初始化 Lottie 动画（空状态）
            if (typeof lottie !== 'undefined' && document.getElementById('lottie-player')) {
                lottie.loadAnimation({
                    container: document.getElementById('lottie-player'),
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    // 使用免费的空盒子动画
                    path: 'https://lottie.host/55db55d6-d847-461b-9071-65435019a7b2/K1Ld6N2iq0.json'
                });
            }
        } else {
            container.innerHTML = teams.map(([teamId, team], index) =>
                this.renderTeamCard(teamId, team, index)
            ).join('');
        }
    }

    updateStatistics(stats) {
        const totalTeamsEl = document.getElementById('totalTeams');
        const totalPokemonsEl = document.getElementById('totalPokemons');
        const formatsCountEl = document.getElementById('formatsCount');

        // 使用数字滚动动画更新统计数据
        if (totalTeamsEl) this.animateNumber($(totalTeamsEl), stats.total_teams);
        if (totalPokemonsEl) this.animateNumber($(totalPokemonsEl), stats.total_pokemons);
        if (formatsCountEl) this.animateNumber($(formatsCountEl), stats.formats_count);
    }

    renderTeamCard(teamId, team, index = 0) {
        const formatName = this.formats[team.format] || team.format || '未设置';
        const pokemonCount = (team.pokemons || []).length;
        const updatedDate = team.updated_at ? team.updated_at.substring(0, 10) : '';
        // 格式化format字符串为小写，用于CSS选择器
        const formatClass = team.format ? team.format.toLowerCase() : 'other';

        // 计算交错动画延迟：每个卡片比前一个晚 0.05秒出现
        // 限制最大延迟为 0.5秒，防止列表太长时底部卡片等太久
        const delay = Math.min(index * 0.05, 0.5);

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
            <div class="team-card" data-team-id="${teamId}" data-format="${formatClass}" style="animation-delay: ${delay}s">
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
            <div class="empty-state empty-state-lottie">
                <div id="lottie-player"></div>
                <h3>还没有队伍</h3>
                <p>点击"导入队伍"开始构建你的冠军之路，或浏览"云端队伍库"快速上手！</p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="app.showImportDialog()" class="button button-primary">
                        <i class="fa fa-upload"></i> 导入队伍
                    </button>
                    <button onclick="app.showCloudLibrary()" class="button button-cloud">
                        <i class="fa fa-cloud"></i> 云端队伍库
                    </button>
                </div>
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
            container.innerHTML = teams.map(([teamId, team], index) =>
                this.renderTeamCard(teamId, team, index)
            ).join('');
        }
    }

    viewTeam(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            this.showToast('队伍不存在', 'error');
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
                        <button onclick="app.exportTeamImage('${this.escapeHtml(teamId)}')" class="button button-primary">
                            <i class="fa fa-camera"></i> 保存图片
                        </button>
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

        // 太晶属性徽章 - 改为内联显示而非绝对定位
        const teraHTML = pokemon.tera_type ? `
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);" class="type-${pokemon.tera_type}">
                <i class="fa fa-star" style="font-size: 12px;"></i>
                <span style="font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">太晶: ${this.utils.translate(pokemon.tera_type)}</span>
            </div>
        ` : '';

        return `
            <div style="background: linear-gradient(135deg, rgba(45, 52, 84, 0.6) 0%, rgba(53, 61, 96, 0.6) 100%); border: 2px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 20px; position: relative; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
                <button onclick="app.editPokemon('${this.escapeHtml(teamId)}', ${idx})"
                        class="button button-sm"
                        style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                    <i class="fa fa-edit"></i>
                </button>

                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                    <div class="image-pokemon" style="background-position: ${coords.x}px ${coords.y}px; transform: scale(1.8);"></div>
                    <div style="flex: 1; margin-left: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <h3 style="margin: 0; font-size: 20px; color: #f8f9fa; font-weight: 700;">${this.escapeHtml(nameCN)}</h3>
                            ${teraHTML}
                        </div>
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
            this.showToast('删除失败', 'error');
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
            this.showToast('复制失败', 'error');
        }
    }

    editTeam(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            this.showToast('队伍不存在', 'error');
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
                const nameInput = dialog.querySelector('#editTeamName');
                nameInput.classList.add('shake-invalid');
                this.showToast('队伍名称不能为空', 'warning');

                // 动画结束后移除类，聚焦输入框
                setTimeout(() => {
                    nameInput.classList.remove('shake-invalid');
                    nameInput.focus();
                }, 500);

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
                    const nameInput = dialog.querySelector('#editTeamName');
                    nameInput.classList.add('shake-invalid');
                    this.showToast('队伍名称已存在，请使用其他名称', 'warning');

                    // 动画结束后移除类，聚焦输入框
                    setTimeout(() => {
                        nameInput.classList.remove('shake-invalid');
                        nameInput.focus();
                    }, 500);

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
                this.showToast('队伍信息更新失败', 'error');
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
            this.showToast('宝可梦不存在', 'error');
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
                this.showToast('宝可梦信息更新失败', 'error');
            }
        });

        // 绑定关闭事件
        dialog.querySelector('.close-button').addEventListener('click', () => {
            dialog.remove();
        });
    }

    updateEVTotal() {
        let total = 0;
        const statNames = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

        // 计算总和并验证每个输入
        [0, 1, 2, 3, 4, 5].forEach((i) => {
            const input = document.querySelector(`#editPokemonEV${i}`);
            if (input) {
                const value = parseInt(input.value) || 0;
                total += value;

                // 单项检查：超过252时标记为invalid并震动
                if (value > 252) {
                    input.classList.add('is-invalid');
                    input.classList.add('shake-invalid');

                    // 动画结束后移除震动类
                    setTimeout(() => {
                        input.classList.remove('shake-invalid');
                    }, 500);
                } else {
                    input.classList.remove('is-invalid');
                }
            }
        });

        const totalEl = document.getElementById('evTotal');
        if (totalEl) {
            totalEl.textContent = total;
            totalEl.className = 'ev-total-display';

            // 根据总计设置样式
            if (total > 510) {
                totalEl.classList.add('text-danger');
                totalEl.parentElement.style.color = '#FF3B30';
            } else if (total === 510) {
                totalEl.classList.add('text-success');
                totalEl.parentElement.style.color = '#34C759';
            } else if (total > 0) {
                totalEl.classList.add('text-warning');
                totalEl.parentElement.style.color = '#FFCC00';
            } else {
                totalEl.parentElement.style.color = '';
            }
        }
    }

    exportTeam(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            this.showToast('队伍不存在', 'error');
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
            const textArea = document.getElementById('importTeamText');
            textArea.classList.add('shake-invalid');
            this.showToast('请粘贴队伍数据', 'warning');

            // 动画结束后移除类，聚焦输入框
            setTimeout(() => {
                textArea.classList.remove('shake-invalid');
                textArea.focus();
            }, 500);

            return;
        }

        try {
            const pokemons = this.showdownParser.parseTeam(showdownText);
            if (pokemons.length === 0) {
                this.showToast('没有解析到任何宝可梦', 'warning');
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
            this.showToast('导入失败：' + error.message, 'error');
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

        // 显示骨架屏
        container.className = ''; // 移除 loading 类
        container.innerHTML = this.renderSkeletons(6);

        try {
            // 从静态文件读取队伍列表
            const response = await fetch('cloud-teams/index.json');
            if (!response.ok) {
                throw new Error('无法加载云端队伍列表');
            }

            const teamsIndex = await response.json();

            if (teamsIndex.length === 0) {
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
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 24px;">
                    ${teams.map((team, index) => this.renderCloudTeamCard(team, index)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('加载云端队伍失败:', error);
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

    renderCloudTeamCard(team, index = 0) {
        const formatName = this.formats[team.format] || team.format || '未设置';
        const pokemonCount = (team.pokemons || []).length;
        const updatedDate = team.updated_at ? team.updated_at.substring(0, 10) : '';
        // 格式化format字符串为小写，用于CSS选择器
        const formatClass = team.format ? team.format.toLowerCase() : 'other';

        // 计算交错动画延迟
        const delay = Math.min(index * 0.05, 0.5);

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
            <div class="team-card" data-format="${formatClass}" style="animation-delay: ${delay}s">
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
            this.showToast('导入失败：' + error.message, 'error');
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
            this.showToast('加载失败：' + error.message, 'error');
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

        // 太晶属性徽章 - 与本地显示保持一致
        const teraHTML = pokemon.tera_type ? `
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);" class="type-${pokemon.tera_type}">
                <i class="fa fa-star" style="font-size: 12px;"></i>
                <span style="font-size: 12px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">太晶: ${this.utils.translate(pokemon.tera_type)}</span>
            </div>
        ` : '';

        // 性格显示
        const natureHTML = pokemon.nature ? `
            <span style="font-size: 13px; color: #f8f9fa;">
                <strong>性格:</strong> ${natureCN}
            </span>
        ` : '';

        return `
            <div style="background: linear-gradient(135deg, rgba(45, 52, 84, 0.6) 0%, rgba(53, 61, 96, 0.6) 100%); border: 2px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 20px; position: relative; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                    <div class="image-pokemon" style="background-position: ${coords.x}px ${coords.y}px; transform: scale(1.8);"></div>
                    <div style="flex: 1; margin-left: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <h3 style="margin: 0; font-size: 20px; color: #f8f9fa; font-weight: 700;">${this.escapeHtml(nameCN)}</h3>
                            ${teraHTML}
                        </div>
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

    showNotification(message, type = 'success') {
        // 使用新的 Toast 系统
        this.showToast(message, type);
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

    /**
     * 搜索聚光灯效果 - 实时高亮匹配的卡片
     */
    applySpotlightSearch(query) {
        const container = document.getElementById('teamsContainer');
        const cards = container.querySelectorAll('.team-card');

        if (!query || query.trim().length === 0) {
            // 搜索框为空，恢复原状
            container.classList.remove('searching');
            cards.forEach(card => card.classList.remove('dimmed'));
            return;
        }

        // 开启搜索模式
        container.classList.add('searching');
        const lowerQuery = query.toLowerCase().trim();

        cards.forEach(card => {
            // 获取卡片的可搜索内容（队伍名、宝可梦名等）
            const teamName = card.querySelector('.team-name')?.textContent || '';
            const pokemonNames = Array.from(card.querySelectorAll('.pokemon-mini'))
                .map(el => el.getAttribute('title') || '')
                .join(' ');
            const tags = Array.from(card.querySelectorAll('.tag'))
                .map(el => el.textContent || '')
                .join(' ');
            const description = card.querySelector('.team-description')?.textContent || '';

            const searchableText = `${teamName} ${pokemonNames} ${tags} ${description}`.toLowerCase();

            // 判断是否匹配
            if (searchableText.includes(lowerQuery)) {
                card.classList.remove('dimmed');
            } else {
                card.classList.add('dimmed');
            }
        });
    }

    /**
     * Konami Code 彩蛋 - ↑↑↓↓←→←→BA
     */
    initKonamiCode() {
        const konamiCode = [
            'ArrowUp', 'ArrowUp',
            'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight',
            'ArrowLeft', 'ArrowRight',
            'b', 'a'
        ];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // 检查是否匹配当前序列
            if (key === konamiCode[konamiIndex].toLowerCase()) {
                konamiIndex++;

                // 完成整个序列
                if (konamiIndex === konamiCode.length) {
                    this.activateGodMode();
                    konamiIndex = 0; // 重置
                }
            } else {
                // 输错了，重置
                konamiIndex = 0;
            }
        });
    }

    /**
     * 上帝模式 - 彩蛋效果
     */
    activateGodMode() {
        // 显示彩蛋提示
        this.showToast('🎮 GOD MODE ACTIVATED! 🎮', 'success');

        // 让所有卡片旋转一圈
        const cards = document.querySelectorAll('.team-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                card.style.transform = 'rotate(360deg) scale(1.1)';

                // 恢复原状
                setTimeout(() => {
                    card.style.transform = '';
                }, 1500);
            }, index * 100); // 交错动画
        });

        // 让统计数字疯狂跳动
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(el => {
            const originalValue = parseInt(el.textContent) || 0;
            let count = 0;
            const interval = setInterval(() => {
                el.textContent = Math.floor(Math.random() * 999);
                count++;
                if (count > 20) {
                    clearInterval(interval);
                    el.textContent = originalValue; // 恢复原值
                }
            }, 50);
        });

        // 可选：播放音效（需要音频文件）
        // const audio = new Audio('data:audio/wav;base64,...'); // 可以添加Base64编码的音效
        // audio.play();
    }

    /**
     * 导出队伍为图片 - 使用 html2canvas (修复滚动截图问题)
     */
    exportTeamImage(teamId) {
        const team = this.teamManager.getTeam(teamId);
        if (!team) {
            this.showToast('队伍不存在', 'error');
            return;
        }

        // 获取模态框内容
        const modalContent = document.querySelector('#teamViewModal .modal-content');
        if (!modalContent) {
            this.showToast('无法获取队伍内容', 'error');
            return;
        }

        // 显示加载提示
        this.showToast('正在生成海报，请稍候...', 'info');

        // 临时隐藏按钮，避免截图包含它们
        const footer = modalContent.querySelector('.modal-footer');
        const originalDisplay = footer.style.display;
        footer.style.display = 'none';

        // 使用 html2canvas 生成图片
        html2canvas(modalContent, {
            backgroundColor: '#1a1f35',
            scale: 2, // 2倍分辨率，更清晰
            useCORS: true, // 允许跨域图片
            logging: false,
            windowWidth: modalContent.scrollWidth,
            windowHeight: modalContent.scrollHeight,

            // 🔥 关键修复：在克隆体上移除滚动限制和按钮，优化布局
            onclone: (clonedDoc) => {
                // 1. 找到克隆后的 modal-content
                const clonedContent = clonedDoc.querySelector('#teamViewModal .modal-content');
                // 2. 找到克隆后的 modal-body (我们之前把滚动条加在了这里)
                const clonedBody = clonedDoc.querySelector('#teamViewModal .modal-body');

                // 3. 移除滚动限制，允许完整显示，强制设置宽度
                if (clonedContent) {
                    clonedContent.style.maxHeight = 'none'; // 移除最大高度限制
                    clonedContent.style.height = 'auto';    // 强制高度自适应
                    clonedContent.style.overflow = 'visible'; // 允许内容溢出显示
                    clonedContent.style.width = '1500px'; // 适中宽度，3列×480px
                    clonedContent.style.maxWidth = 'none'; // 移除maxWidth限制
                }

                if (clonedBody) {
                    clonedBody.style.maxHeight = 'none';
                    clonedBody.style.height = 'auto';
                    clonedBody.style.overflow = 'visible';
                    clonedBody.style.width = '100%'; // 确保body撑满
                }

                // 4. 保持3列横版布局，增加间距
                const clonedPokemonGrid = clonedDoc.querySelector('.team-view-pokemon-grid');
                if (clonedPokemonGrid) {
                    clonedPokemonGrid.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 保持3列
                    clonedPokemonGrid.style.gap = '32px'; // 增加间距
                }

                // 5. 隐藏所有按钮（footer + 编辑按钮）
                const clonedFooter = clonedDoc.querySelector('#teamViewModal .modal-footer');
                if (clonedFooter) {
                    clonedFooter.style.display = 'none';
                }

                // 6. 隐藏队伍信息区域的"编辑队伍信息"按钮
                const clonedEditTeamBtn = clonedDoc.querySelector('.team-view-info .button');
                if (clonedEditTeamBtn) {
                    clonedEditTeamBtn.style.display = 'none';
                }

                // 7. 隐藏所有宝可梦卡片上的"编辑"按钮
                const clonedEditButtons = clonedDoc.querySelectorAll('#teamViewModal .team-view-pokemon-grid button');
                clonedEditButtons.forEach(btn => {
                    btn.style.display = 'none';
                });

                // 8. 让队伍标题和格式信息居中显示
                const clonedModalHeader = clonedDoc.querySelector('#teamViewModal .modal-header');
                if (clonedModalHeader) {
                    clonedModalHeader.style.textAlign = 'center';
                    clonedModalHeader.style.justifyContent = 'center';
                    // 隐藏modal-header中的关闭按钮
                    const closeBtn = clonedModalHeader.querySelector('.close-button');
                    if (closeBtn) closeBtn.style.display = 'none';
                }

                // 9. 让队伍信息区域居中
                const clonedTeamViewInfo = clonedDoc.querySelector('.team-view-info');
                if (clonedTeamViewInfo) {
                    clonedTeamViewInfo.style.justifyContent = 'center';
                    clonedTeamViewInfo.style.textAlign = 'center';
                }

                // 10. 让描述居中
                const clonedDescription = clonedDoc.querySelector('.team-view-description');
                if (clonedDescription) {
                    clonedDescription.style.textAlign = 'center';
                }

                // 11. 修复type-badge文字底色问题（完全参考太晶属性的样式）
                const clonedTypeBadges = clonedDoc.querySelectorAll('.type-badge');
                clonedTypeBadges.forEach(badge => {
                    // 完全按照太晶属性的样式设置
                    // 太晶属性外层div样式：
                    badge.style.display = 'inline-flex';
                    badge.style.alignItems = 'center';
                    badge.style.gap = '6px';
                    badge.style.padding = '6px 12px';
                    badge.style.borderRadius = '20px';
                    badge.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                    badge.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';

                    // 太晶属性内部span的文字样式：
                    badge.style.fontSize = '12px';
                    badge.style.fontWeight = '700';
                    badge.style.color = 'white';
                    badge.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';

                    // 其他保持不变
                    badge.style.textTransform = 'uppercase';
                    badge.style.letterSpacing = '0.5px';
                    badge.style.fontFamily = 'Arial, sans-serif';
                    badge.style.webkitBackgroundClip = 'padding-box';
                    badge.style.backgroundClip = 'padding-box';
                });
            }
        }).then(canvas => {
            // 恢复按钮显示
            footer.style.display = originalDisplay;

            // 创建下载链接
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `宝可梦队伍-${team.name}-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            this.showToast('海报保存成功！', 'success');
        }).catch(err => {
            // 恢复按钮显示
            footer.style.display = originalDisplay;

            console.error('生成图片失败:', err);
            this.showToast('生成图片失败，请重试', 'error');
        });
    }
}

// 应用初始化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TeamManagerApp();
});
