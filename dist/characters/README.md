# Character Art Slots

把角色 JPG 放在这里，路径会被源码默认读取：

```text
public/characters/<character_id>/card.jpg    # 设置页角色卡图
public/characters/<character_id>/avatar.jpg  # 对局 HUD 头像，建议正方形
public/characters/<character_id>/banner.jpg  # 预留横幅图，当前未显示
```

当前角色 ID：

```text
character_a
character_b
character_c
character_d
character_e
character_f
character_g
```

如果要使用别的文件名或格式，修改对应角色数据文件里的 `art` 字段即可。
