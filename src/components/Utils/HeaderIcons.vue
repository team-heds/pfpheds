<template>
  <div class="header-bar-mobile">
    <img src="/assets/images/hespicto.png" alt="Logo école" class="school-logo" />
    <div class="header-icons-mobile">
      <i class="pi pi-bell notif-icon"></i>
      <i class="pi pi-send msg-icon"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: "HeaderIcons"
}
</script>

<style scoped>
.header-bar-mobile {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 4vw 0 4vw;
  height: 90px;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  background-color: transparent;
}
.school-logo {
  height: 40px;
  width: 40px;
  object-fit: contain;
}
.header-icons-mobile {
  display: flex;
  gap: 1px;
  align-items: center;
}
.notif-icon, .msg-icon {
  padding-right: 2rem;
  width: 40px;
  height: 50px;
  font-size: 24px;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notif-icon:hover, .msg-icon:hover {
  color: #F3C300;
}
@media (min-width: 601px) {
  .header-bar-mobile { display: none; }
}
</style>