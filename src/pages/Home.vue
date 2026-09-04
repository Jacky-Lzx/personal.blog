<script setup>
import PostList from "../components/PostList.vue";
import { posts } from "../lib/posts";
</script>

<template>
  <section class="home-hero reveal">
    <p class="hero-line">
      <span class="t-prompt">❯</span>
      <span class="t-cmd">whoami</span>
    </p>
    <h1>李泽玺的博客</h1>
    <p class="hero-sub">
      电路 · 架构 · 新兴计算范式 <span class="t-comment">(# 记录研究与工程中的思考，共 {{ posts.length }} 篇)</span>
    </p>
  </section>

  <section class="reveal">
    <PostList />
  </section>
</template>
