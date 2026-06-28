<script lang="ts">
  const PAGE_URL = 'https://odq-sign-generator.pages.dev';
  const SHARE_TEXT = '小田急駅名標ジェネレーター';

  const shareLinks = [
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(PAGE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    },
    {
      name: 'LINE',
      url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(PAGE_URL)}`,
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PAGE_URL)}`,
    },
  ];
</script>

<header class="header">
  <h1 class="site-title">小田急駅名標ジェネレーター</h1>
  <nav class="share-links" aria-label="SNSシェア">
    {#each shareLinks as link}
      <a href={link.url} target="_blank" rel="noopener noreferrer" class="share-link">
        {link.name}
      </a>
    {/each}
  </nav>
</header>

<style>
  .header {
    text-align: center;
    margin-bottom: 24px;
  }

  .share-links {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .share-link {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 4px;
    font-size: 0.85rem;
    text-decoration: none;
    color: #fff;
    background-color: var(--odakyu-blue);
    transition: background-color 0.2s;
  }

  .share-link:hover {
    background-color: var(--odakyu-dark-blue);
  }
</style>
