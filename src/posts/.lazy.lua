return {
  {
    "obsidian-nvim/obsidian.nvim",
    optional = true,
    lazy = false,
    opts = {
      workspaces = {
        {
          name = "Blog Posts",
          path = "~/Documents/Playground/homesites/personal.blog/src/posts",
        },
      },

      -- 博客 vault 的目录结构（与 .obsidian/app.json 保持一致）：
      -- 顶层 *.md 发布为文章，新笔记先进 Inbox/ 草稿，图片存 attachments/
      notes_subdir = "Inbox",
      new_notes_location = "notes_subdir",

      -- wikilink 用最短路径：顶层文章即 [[文件名]]，与博客的链接解析一致
      link = {
        style = "wiki",
        format = "shortest",
      },

      -- 粘贴图片存到 attachments/（博客构建时从这里解析 ![[...]] 嵌入）
      attachments = {
        folder = "attachments",
      },
    },
  },
  {
    "Jacky-Lzx/image-insert.nvim",
    dev = true,
    opts = {
      dir_path = "attachments",
      prompt_for_file_name = false,
      relative_to_current_file = false,
      insert_relative_to = "file",
      process = { cmd = "magick - avif:-", extension = "avif" },
    },
  },
}
