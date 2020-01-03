<template>
    <b-col cols="12">
        <b-row v-if="$route.fullPath.includes('allocate')">
            <nuxt-child :key="$route.params.shipmentId" />
        </b-row>
        <b-row v-else>
            <b-col cols="3">
                <b-card header="Shipments">
                    <keep-alive><shipments-list /></keep-alive
                ></b-card>
            </b-col>
            <b-col cols="9">
                <b-row>
                    <nuxt-child :key="$route.params.shipmentId" />
                </b-row>
            </b-col>
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import ShipmentsList from '~/components/ShipmentsList.vue'
@Component({
    components: { ShipmentsList }
})
export default class Shipments extends Vue {}
</script>

<style scoped></style>
