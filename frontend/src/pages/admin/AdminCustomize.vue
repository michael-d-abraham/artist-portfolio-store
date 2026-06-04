<template>
  <div class="admin-page admin-customize">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Customize</h1>
    </header>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Contact &amp; social</h2>
      <AdminSocialLinks embedded />
    </section>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Contact page image</h2>
      <AdminDisplayPictures embedded />
    </section>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Home page</h2>
      <AdminHomePage embedded />
    </section>
  </div>
</template>

<script setup>
import AdminSocialLinks from '../AdminSocialLinks.vue';
import AdminDisplayPictures from '../AdminDisplayPictures.vue';
import AdminHomePage from '../AdminHomePage.vue';
</script>
