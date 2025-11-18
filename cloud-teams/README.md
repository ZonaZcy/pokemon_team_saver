# 云端队伍库使用说明

云端队伍库允许你在静态网站中预设一些队伍供用户浏览和导入。

## 目录结构

```
static-site/
└── cloud-teams/
    ├── index.json              # 队伍索引文件
    ├── example-team.json       # 示例队伍
    └── dondozo-commander.json  # 多多殿下指令队
```

## 如何添加队伍

### 方法一：使用Python脚本（推荐）

运行根目录下的 `add_cloud_team.py` 脚本：

```bash
python add_cloud_team.py
```

然后按照提示操作：
1. 输入队伍名称
2. 输入格式代码（如 gen9vgc2025regj）
3. 输入队伍描述（可选）
4. 输入标签（可选，用逗号分隔）
5. 粘贴Showdown格式的队伍数据
6. 输入两个空行结束

脚本会自动：
- 解析Showdown格式
- 生成JSON文件
- 更新index.json

### 方法二：手动创建

#### 1. 创建队伍JSON文件

在 `cloud-teams/` 目录下创建一个新的JSON文件，例如 `my-team.json`：

```json
{
  "name": "我的队伍",
  "format": "gen9vgc2025regj",
  "description": "队伍描述",
  "tags": ["标签1", "标签2"],
  "pokemons": [
    {
      "name": "Rillaboom",
      "nickname": "",
      "gender": "M",
      "item": "Assault Vest",
      "ability": "Grassy Surge",
      "level": 50,
      "tera_type": "Fire",
      "nature": "Adamant",
      "evs": [252, 252, 0, 0, 4, 0],
      "ivs": [31, 31, 31, 31, 31, 31],
      "moves": ["Fake Out", "Grassy Glide", "Wood Hammer", "U-turn"]
    }
  ],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

#### 2. 更新index.json

编辑 `cloud-teams/index.json`，添加你的队伍信息：

```json
[
  {
    "filename": "my-team.json",
    "name": "我的队伍",
    "format": "gen9vgc2025regj",
    "description": "队伍描述"
  }
]
```

## 数据格式说明

### EVs和IVs格式

EVs和IVs使用数组表示，顺序为：
```
[HP, Atk, Def, SpA, SpD, Spe]
```

例如：
- `[252, 252, 0, 0, 4, 0]` = 252 HP / 252 Atk / 4 SpD
- `[31, 0, 31, 31, 31, 31]` = 0 Atk IV

### 常用格式代码

- `gen9vgc2025regj` - Gen 9 VGC 2025 Reg J
- `gen9vgc2025regi` - Gen 9 VGC 2025 Reg I
- `gen9vgc2024regg` - Gen 9 VGC 2024 Reg G
- `gen9doublesou` - Gen 9 Doubles OU

## 特性

- **只读模式**：云端队伍不能直接编辑，用户只能预览和导入到本地
- **自动翻译**：队伍中的宝可梦、招式、特性、道具都会自动翻译成中文
- **精灵图标**：自动显示宝可梦的图标
- **属性徽章**：招式会显示对应的属性颜色徽章
- **完整数据**：包括努力值、个体值、性格、太晶属性等完整配置

## 使用场景

- 分享竞技队伍配置
- 提供新手教学队伍
- 展示赛事获胜队伍
- 保存常用队伍模板

## 注意事项

1. 所有JSON文件必须使用UTF-8编码
2. index.json中的filename必须与实际文件名一致
3. 队伍文件名建议使用小写字母和连字符
4. 删除队伍时记得同时更新index.json
