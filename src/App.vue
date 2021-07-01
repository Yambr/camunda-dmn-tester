<template>
  <div id="app">
    <b-container class="mb-2">
      <b-navbar variant="light" type="light">
        <b-navbar-brand to="/">Camunda Dmn</b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/">
              <b-icon-house></b-icon-house>
              Home
            </b-nav-item>
            <b-nav-item to="/files">
              <b-icon-folder></b-icon-folder>
              Files
            </b-nav-item>
            <b-nav-item to="/dmn">
              <b-icon-diagram3></b-icon-diagram3>
              Dmn
            </b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </b-container>
    <router-view/>
  </div>
</template>

<style lang="scss">

</style>
