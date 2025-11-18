#!/usr/bin/env python3
"""
云端队伍添加工具
将Showdown格式的队伍转换为JSON并添加到云端队伍库
"""

import json
import os
import sys
import re
from datetime import datetime


def parse_showdown_team(showdown_text):
    """
    解析Showdown格式的队伍文本
    """
    pokemons = []
    lines = showdown_text.strip().split('\n')

    current_pokemon = None

    for line in lines:
        line = line.strip()

        if not line:
            if current_pokemon:
                pokemons.append(current_pokemon)
                current_pokemon = None
            continue

        # 第一行：宝可梦名称、昵称、性别、道具
        if not current_pokemon:
            current_pokemon = {
                'name': '',
                'nickname': '',
                'gender': '',
                'item': '',
                'ability': '',
                'level': 50,
                'tera_type': '',
                'nature': '',
                'evs': [0, 0, 0, 0, 0, 0],
                'ivs': [31, 31, 31, 31, 31, 31],
                'moves': []
            }

            # 解析第一行 - 使用与 psteam.py 相同的逻辑
            # 格式: Nickname (Name) (Gender) @ Item
            # 或: Name (Gender) @ Item
            # 或: Name @ Item

            # 首先找到性别和道具的位置
            pos2 = -1
            gender = ''

            # 查找 (F) 或 (M)
            if ' (F) @ ' in line:
                pos2 = line.rfind(' (F) @ ')
                gender = 'F'
            elif ' (F)\n' in line or line.endswith(' (F)'):
                pos2 = line.rfind(' (F)')
                gender = 'F'
            elif ' (M) @ ' in line:
                pos2 = line.rfind(' (M) @ ')
                gender = 'M'
            elif ' (M)\n' in line or line.endswith(' (M)'):
                pos2 = line.rfind(' (M)')
                gender = 'M'
            elif ' @ ' in line:
                pos2 = line.rfind(' @ ')
            else:
                pos2 = len(line)

            # 提取道具
            item = ''
            if ' @ ' in line:
                item_start = line.find(' @ ', pos2 if pos2 > 0 else 0) + 3
                item = line[item_start:].strip()

            # 检查是否有昵称（括号）
            if pos2 > 0 and line[pos2-1] == ')':
                # 有括号，可能是昵称
                pos1 = pos2 - 2
                while pos1 >= 0 and line[pos1] != '(':
                    pos1 -= 1
                if pos1 >= 0:
                    pos1 += 1
                    current_pokemon['nickname'] = line[:pos1-2].strip()
                    current_pokemon['name'] = line[pos1:pos2-1].strip()
                else:
                    current_pokemon['name'] = line[:pos2].strip()
            else:
                # 没有括号，直接是名字
                pos1 = 0
                current_pokemon['name'] = line[pos1:pos2].strip()

            current_pokemon['gender'] = gender
            current_pokemon['item'] = item

        # 特性
        elif line.startswith('Ability:'):
            current_pokemon['ability'] = line.replace('Ability:', '').strip()

        # 等级
        elif line.startswith('Level:'):
            current_pokemon['level'] = int(line.replace('Level:', '').strip())

        # 太晶属性
        elif line.startswith('Tera Type:'):
            current_pokemon['tera_type'] = line.replace('Tera Type:', '').strip()

        # EVs
        elif line.startswith('EVs:'):
            evs_str = line.replace('EVs:', '').strip()
            ev_parts = evs_str.split(' / ')
            evs = [0, 0, 0, 0, 0, 0]
            stat_order = {'HP': 0, 'Atk': 1, 'Def': 2, 'SpA': 3, 'SpD': 4, 'Spe': 5}

            for part in ev_parts:
                match = re.match(r'(\d+)\s+(\w+)', part.strip())
                if match:
                    value = int(match.group(1))
                    stat = match.group(2)
                    if stat in stat_order:
                        evs[stat_order[stat]] = value

            current_pokemon['evs'] = evs

        # IVs
        elif line.startswith('IVs:'):
            ivs_str = line.replace('IVs:', '').strip()
            iv_parts = ivs_str.split(' / ')
            ivs = [31, 31, 31, 31, 31, 31]
            stat_order = {'HP': 0, 'Atk': 1, 'Def': 2, 'SpA': 3, 'SpD': 4, 'Spe': 5}

            for part in iv_parts:
                match = re.match(r'(\d+)\s+(\w+)', part.strip())
                if match:
                    value = int(match.group(1))
                    stat = match.group(2)
                    if stat in stat_order:
                        ivs[stat_order[stat]] = value

            current_pokemon['ivs'] = ivs

        # 性格
        elif 'Nature' in line:
            current_pokemon['nature'] = line.replace('Nature', '').strip()

        # 招式
        elif line.startswith('-'):
            move = line[1:].strip()
            current_pokemon['moves'].append(move)

    # 添加最后一只宝可梦
    if current_pokemon:
        pokemons.append(current_pokemon)

    return pokemons


def add_cloud_team():
    """
    添加队伍到云端库
    """
    print("=" * 60)
    print("云端队伍添加工具")
    print("=" * 60)

    # 队伍信息
    team_name = input("\n队伍名称: ").strip()
    if not team_name:
        print("错误：队伍名称不能为空")
        return

    format_code = input("格式代码 (如 gen9vgc2025regj): ").strip()
    if not format_code:
        format_code = "gen9vgc2025regj"

    description = input("队伍描述 (可选): ").strip()
    tags_str = input("标签 (用逗号分隔，可选): ").strip()
    tags = [t.strip() for t in tags_str.split(',')] if tags_str else []

    # 读取队伍数据
    print("\n请粘贴Showdown格式的队伍数据（粘贴完成后输入空行两次结束）:")
    print("-" * 60)

    lines = []
    empty_count = 0
    while True:
        try:
            line = input()
            if not line.strip():
                empty_count += 1
                if empty_count >= 2:
                    break
            else:
                empty_count = 0
            lines.append(line)
        except EOFError:
            break

    showdown_text = '\n'.join(lines)

    if not showdown_text.strip():
        print("错误：没有输入队伍数据")
        return

    # 解析队伍
    print("\n正在解析队伍...")
    pokemons = parse_showdown_team(showdown_text)

    if not pokemons:
        print("错误：没有解析到任何宝可梦")
        return

    print(f"成功解析 {len(pokemons)} 只宝可梦:")
    for i, p in enumerate(pokemons, 1):
        print(f"  {i}. {p['name']}")

    # 生成文件名
    filename = re.sub(r'[^\w\s-]', '', team_name.lower())
    filename = re.sub(r'[-\s]+', '-', filename)
    filename = f"{filename}.json"

    print(f"\n将保存为: {filename}")

    # 构建队伍JSON
    now = datetime.utcnow().isoformat() + 'Z'
    team_data = {
        'name': team_name,
        'format': format_code,
        'description': description,
        'tags': tags,
        'pokemons': pokemons,
        'created_at': now,
        'updated_at': now
    }

    # 确定路径
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cloud_teams_dir = os.path.join(script_dir, 'static-site', 'cloud-teams')

    if not os.path.exists(cloud_teams_dir):
        print(f"错误：云端队伍目录不存在: {cloud_teams_dir}")
        return

    # 保存队伍文件
    team_file_path = os.path.join(cloud_teams_dir, filename)
    with open(team_file_path, 'w', encoding='utf-8') as f:
        json.dump(team_data, f, ensure_ascii=False, indent=2)

    print(f"✓ 队伍文件已保存: {team_file_path}")

    # 更新index.json
    index_path = os.path.join(cloud_teams_dir, 'index.json')

    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            index_data = json.load(f)
    else:
        index_data = []

    # 检查是否已存在
    existing = next((item for item in index_data if item['filename'] == filename), None)

    if existing:
        # 更新现有条目
        existing['name'] = team_name
        existing['format'] = format_code
        existing['description'] = description
        print(f"✓ 已更新index.json中的现有条目")
    else:
        # 添加新条目
        index_data.append({
            'filename': filename,
            'name': team_name,
            'format': format_code,
            'description': description
        })
        print(f"✓ 已添加到index.json")

    # 保存index.json
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"✓ 队伍 '{team_name}' 已成功添加到云端库！")
    print("=" * 60)


if __name__ == '__main__':
    try:
        add_cloud_team()
    except KeyboardInterrupt:
        print("\n\n已取消")
    except Exception as e:
        print(f"\n错误：{e}")
        import traceback
        traceback.print_exc()
