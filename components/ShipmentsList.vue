<template>
    <b-list-group>
        <b-list-group-item>
            Active Shipments
        </b-list-group-item>
        <b-list-group-item
            v-for="{ id, fulfillmentCenterId, boxCount } in activeShipments"
            :key="id"
            :to="`/shipments/${id}`"
            class="py-1"
        >
            <b-row>
                <b-col cols="2">{{ id }}</b-col>
                <b-col cols="10">
                    <h5>
                        <b-badge variant="info">{{
                            fulfillmentCenterId
                        }}</b-badge>
                        <b-badge variant="info"
                            >{{ boxCount - 1 }}
                            {{ boxCount - 1 === 1 ? 'Box' : 'Boxes' }}</b-badge
                        >
                    </h5>
                </b-col>
            </b-row>
        </b-list-group-item>
        <b-list-group-item>
            Inactive Shipments
        </b-list-group-item>
        <b-list-group-item
            v-for="{
                id,
                fulfillmentCenterId,
                invoiced,
                boxCount
            } in inactiveShipments"
            :key="id"
            :to="`/shipments/${id}`"
            class="py-1"
        >
            <b-row>
                <b-col cols="2">{{ id }}</b-col>
                <b-col cols="10">
                    <h5>
                        <b-badge variant="secondary">{{
                            fulfillmentCenterId
                        }}</b-badge>
                        <b-badge variant="info"
                            >{{ boxCount - 1 }}
                            {{ boxCount - 1 === 1 ? 'Box' : 'Boxes' }}</b-badge
                        >
                        <b-badge v-if="invoiced" variant="success">
                            Invoiced
                        </b-badge>
                    </h5>
                </b-col>
            </b-row>
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
            this.shipments = shipments.sort(
                (a: any, b: any) => b.boxCount - a.boxCount
            )
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

<style scoped></style>
