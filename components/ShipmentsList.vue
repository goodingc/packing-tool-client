<template>
    <b-list-group>
        <b-list-group-item>
            Active Shipments
        </b-list-group-item>
        <b-list-group-item
            v-for="{
                                id,
                                fulfillmentCenterId
                            } in activeShipments"
            :key="id"
            :to="`/shipments/${id}`"
        >
            {{ id }}
            <b-badge variant="info">{{
                fulfillmentCenterId
                }}</b-badge>
        </b-list-group-item>
        <b-list-group-item>
            Inactive Shipments
        </b-list-group-item>
        <b-list-group-item
            v-for="{
                                id,
                                fulfillmentCenterId,
                                invoiced
                            } in inactiveShipments"
            :key="id"
            :to="`/shipments/${id}`"
        >
            {{ id }}
            <b-badge variant="secondary">{{
                fulfillmentCenterId
                }}</b-badge>
            <b-badge v-if="invoiced" variant="success">Invoiced</b-badge>
        </b-list-group-item>
    </b-list-group>
</template>

<script lang="ts">
    import Vue from 'vue'
    import Component from 'vue-class-component'

    @Component
    export default class ShipmentsList extends Vue {
        shipments: any[] = []

        mounted() {
            this.$send('shipments/getAll').then((shipments) => {
                this.shipments = shipments
            })
        }

        get activeShipments() {
            return this.shipments.filter(({ active }) => active)
        }

        get inactiveShipments() {
            return this.shipments.filter(({ active }) => !active)
        }
    }
</script>

<style scoped>

</style>
