#!/usr/bin/env python3
"""
云端队伍添加工具 - GUI版本
将Showdown格式的队伍转换为JSON并添加到云端队伍库
使用 tkinter 创建图形用户界面
"""

import json
import os
import sys
import re
from datetime import datetime
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog


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


class CloudTeamGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("云端队伍添加工具")
        self.root.geometry("800x700")

        # 设置窗口最小大小
        self.root.minsize(600, 500)

        # 创建主框架
        main_frame = ttk.Frame(root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # 配置权重，使得组件可以扩展
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)

        # 创建界面组件
        self.create_widgets(main_frame)

    def create_widgets(self, parent):
        # 标题
        title_label = ttk.Label(parent, text="云端队伍添加工具",
                               font=('Arial', 16, 'bold'))
        title_label.grid(row=0, column=0, pady=(0, 20))

        # 队伍信息框架
        info_frame = ttk.LabelFrame(parent, text="队伍信息", padding="10")
        info_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        info_frame.columnconfigure(1, weight=1)

        # 队伍名称
        ttk.Label(info_frame, text="队伍名称:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.team_name_entry = ttk.Entry(info_frame, width=50)
        self.team_name_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=5, padx=(10, 0))

        # 格式代码
        ttk.Label(info_frame, text="格式代码:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.format_entry = ttk.Entry(info_frame, width=50)
        self.format_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=5, padx=(10, 0))
        self.format_entry.insert(0, "gen9vgc2025regj")

        # 队伍描述
        ttk.Label(info_frame, text="队伍描述:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.description_entry = ttk.Entry(info_frame, width=50)
        self.description_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5, padx=(10, 0))

        # 标签
        ttk.Label(info_frame, text="标签 (逗号分隔):").grid(row=3, column=0, sticky=tk.W, pady=5)
        self.tags_entry = ttk.Entry(info_frame, width=50)
        self.tags_entry.grid(row=3, column=1, sticky=(tk.W, tk.E), pady=5, padx=(10, 0))

        # Showdown数据框架
        data_frame = ttk.LabelFrame(parent, text="Showdown 格式队伍数据", padding="10")
        data_frame.grid(row=2, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        data_frame.columnconfigure(0, weight=1)
        data_frame.rowconfigure(0, weight=1)
        parent.rowconfigure(2, weight=1)

        # 文本框
        self.team_text = scrolledtext.ScrolledText(data_frame, width=70, height=15,
                                                    wrap=tk.WORD, font=('Consolas', 10))
        self.team_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # 提示文本
        placeholder = """粘贴 Pokemon Showdown 格式的队伍，例如:

Rillaboom @ Assault Vest
Ability: Grassy Surge
Level: 50
Tera Type: Fire
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- U-turn

"""
        self.team_text.insert('1.0', placeholder)
        self.team_text.bind('<FocusIn>', self.on_text_focus_in)

        # 状态信息
        self.status_label = ttk.Label(parent, text="", foreground="blue")
        self.status_label.grid(row=3, column=0, pady=5)

        # 按钮框架
        button_frame = ttk.Frame(parent)
        button_frame.grid(row=4, column=0, pady=(0, 10))

        # 按钮
        ttk.Button(button_frame, text="从文件导入",
                  command=self.load_from_file).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="解析预览",
                  command=self.preview_team).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="保存到云端",
                  command=self.save_team, style='Accent.TButton').pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="清空",
                  command=self.clear_form).pack(side=tk.LEFT, padx=5)

    def on_text_focus_in(self, event):
        """当文本框获得焦点时，清除提示文本"""
        if self.team_text.get('1.0', tk.END).strip().startswith('粘贴 Pokemon Showdown'):
            self.team_text.delete('1.0', tk.END)

    def load_from_file(self):
        """从文件导入队伍数据"""
        filename = filedialog.askopenfilename(
            title="选择队伍文件",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.team_text.delete('1.0', tk.END)
                self.team_text.insert('1.0', content)
                self.status_label.config(text=f"已从文件导入: {os.path.basename(filename)}",
                                       foreground="green")
            except Exception as e:
                messagebox.showerror("错误", f"读取文件失败: {e}")

    def preview_team(self):
        """预览解析的队伍"""
        showdown_text = self.team_text.get('1.0', tk.END)

        if not showdown_text.strip() or showdown_text.strip().startswith('粘贴 Pokemon Showdown'):
            messagebox.showwarning("警告", "请先输入队伍数据")
            return

        try:
            pokemons = parse_showdown_team(showdown_text)

            if not pokemons:
                messagebox.showwarning("警告", "没有解析到任何宝可梦")
                return

            # 创建预览窗口
            preview_window = tk.Toplevel(self.root)
            preview_window.title("队伍预览")
            preview_window.geometry("500x400")

            preview_frame = ttk.Frame(preview_window, padding="10")
            preview_frame.pack(fill=tk.BOTH, expand=True)

            ttk.Label(preview_frame, text=f"成功解析 {len(pokemons)} 只宝可梦:",
                     font=('Arial', 12, 'bold')).pack(pady=(0, 10))

            # 创建滚动文本框显示详情
            preview_text = scrolledtext.ScrolledText(preview_frame, width=60, height=20,
                                                     wrap=tk.WORD, font=('Consolas', 9))
            preview_text.pack(fill=tk.BOTH, expand=True)

            for i, p in enumerate(pokemons, 1):
                preview_text.insert(tk.END, f"\n{i}. {p['name']}\n")
                if p['nickname']:
                    preview_text.insert(tk.END, f"   昵称: {p['nickname']}\n")
                if p['item']:
                    preview_text.insert(tk.END, f"   道具: {p['item']}\n")
                if p['ability']:
                    preview_text.insert(tk.END, f"   特性: {p['ability']}\n")
                if p['nature']:
                    preview_text.insert(tk.END, f"   性格: {p['nature']}\n")
                if p['tera_type']:
                    preview_text.insert(tk.END, f"   太晶: {p['tera_type']}\n")
                if p['moves']:
                    preview_text.insert(tk.END, f"   招式: {', '.join(p['moves'])}\n")

            preview_text.config(state=tk.DISABLED)

            ttk.Button(preview_frame, text="关闭",
                      command=preview_window.destroy).pack(pady=(10, 0))

            self.status_label.config(text=f"解析成功：{len(pokemons)} 只宝可梦",
                                   foreground="green")

        except Exception as e:
            messagebox.showerror("错误", f"解析失败: {e}")
            self.status_label.config(text="解析失败", foreground="red")

    def save_team(self):
        """保存队伍到云端库"""
        # 获取表单数据
        team_name = self.team_name_entry.get().strip()
        format_code = self.format_entry.get().strip()
        description = self.description_entry.get().strip()
        tags_str = self.tags_entry.get().strip()
        showdown_text = self.team_text.get('1.0', tk.END)

        # 验证数据
        if not team_name:
            messagebox.showwarning("警告", "队伍名称不能为空")
            return

        if not showdown_text.strip() or showdown_text.strip().startswith('粘贴 Pokemon Showdown'):
            messagebox.showwarning("警告", "请先输入队伍数据")
            return

        try:
            # 解析队伍
            pokemons = parse_showdown_team(showdown_text)

            if not pokemons:
                messagebox.showwarning("警告", "没有解析到任何宝可梦")
                return

            # 生成文件名
            filename = re.sub(r'[^\w\s-]', '', team_name.lower())
            filename = re.sub(r'[-\s]+', '-', filename)
            filename = f"{filename}.json"

            # 解析标签
            tags = [t.strip() for t in tags_str.split(',')] if tags_str else []

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
            cloud_teams_dir = os.path.join(script_dir, 'cloud-teams')

            if not os.path.exists(cloud_teams_dir):
                messagebox.showerror("错误", f"云端队伍目录不存在: {cloud_teams_dir}")
                return

            # 保存队伍文件
            team_file_path = os.path.join(cloud_teams_dir, filename)
            with open(team_file_path, 'w', encoding='utf-8') as f:
                json.dump(team_data, f, ensure_ascii=False, indent=2)

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
                action = "更新"
            else:
                # 添加新条目
                index_data.append({
                    'filename': filename,
                    'name': team_name,
                    'format': format_code,
                    'description': description
                })
                action = "添加"

            # 保存index.json
            with open(index_path, 'w', encoding='utf-8') as f:
                json.dump(index_data, f, ensure_ascii=False, indent=2)

            # 显示成功消息
            success_msg = f"队伍 '{team_name}' 已成功{action}到云端库！\n\n"
            success_msg += f"文件: {filename}\n"
            success_msg += f"宝可梦数量: {len(pokemons)}"

            messagebox.showinfo("成功", success_msg)
            self.status_label.config(text=f"保存成功: {filename}", foreground="green")

            # 询问是否清空表单
            if messagebox.askyesno("提示", "是否清空表单以添加新队伍？"):
                self.clear_form()

        except Exception as e:
            messagebox.showerror("错误", f"保存失败: {e}")
            self.status_label.config(text="保存失败", foreground="red")
            import traceback
            traceback.print_exc()

    def clear_form(self):
        """清空表单"""
        self.team_name_entry.delete(0, tk.END)
        self.format_entry.delete(0, tk.END)
        self.format_entry.insert(0, "gen9vgc2025regj")
        self.description_entry.delete(0, tk.END)
        self.tags_entry.delete(0, tk.END)
        self.team_text.delete('1.0', tk.END)
        self.status_label.config(text="")


def main():
    root = tk.Tk()
    app = CloudTeamGUI(root)
    root.mainloop()


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"错误：{e}")
        import traceback
        traceback.print_exc()
