<template>
    <b-col cols="12">
        <b-row>
            <b-navbar variation="light">
                <b-navbar-brand to="/">Packing Tool</b-navbar-brand>

                <b-navbar-nav>
                    <b-nav-item to="/upload-data">Upload Data</b-nav-item>
                    <b-nav-item to="/packing-list">Packing List</b-nav-item>
                    <b-nav-item to="/shipments">Shipments</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </b-row>
        <b-row>
            <nuxt />
        </b-row>
    </b-col>
</template>
