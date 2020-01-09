<template>
    <b-col cols="12">
        <b-card :header="`Shipment ${this.shipment.id}`">
            <b-row class="mb-3">
                <b-col cols="3">
                    FC: {{ shipment.fulfillmentCenterId }}
                    <b-badge v-if="shipment.active" variant="info"
                        >Active</b-badge
                    >
                    <b-badge v-if="!shipment.open" variant="secondary"
                        >Closed</b-badge
                    >
                </b-col>
                <b-col cols="3">
                    Shipment Profit: £{{ totalProfit.toFixed(2) }}
                </b-col>
                <b-col cols="3"> Shipment Weight: {{ totalWeight }} kg </b-col>
                <b-col cols="3">
                    <span id="close-button-wrapper">
                        <b-button
                            variant="danger"
                            @click="close"
                            class="w-100"
                            :disabled="closeError"
                            v-if="true || shipment.open"
                        >
                            Close Shipment
                        </b-button>
                    </span>
                    <b-popover
                        v-if="closeError"
                        target="close-button-wrapper"
                        triggers="hover"
                        title="Not closeable"
                        variant="danger"
                    >
                        {{ closeError }}
                    </b-popover>
                </b-col>
            </b-row>
            <b-row class="mb-3">
                <b-col cols="12">
                    <b-table-simple small>
                        <b-thead>
                            <b-tr>
                                <b-th colspan="2">Box</b-th>
                                <b-th colspan="4">Allocations</b-th>
                            </b-tr>
                            <b-tr>
                                <b-th>Index</b-th>
                                <b-th>Weight</b-th>
                                <b-th>SKU</b-th>
                                <b-th>PO #</b-th>
                                <b-th>Quantity</b-th>
                                <b-th></b-th>
                            </b-tr>
                        </b-thead>
                        <b-tbody>
                            <template v-for="box in boxes">
                                <b-tr
                                    v-if="
                                        box.purchaseOrderProducts.length === 0
                                    "
                                    :key="box.index"
                                >
                                    <b-td
                                        >{{ box.index }}
                                        <b-badge
                                            v-if="box.index === 0"
                                            variant="success"
                                            >Unboxed</b-badge
                                        >
                                        <b-badge v-else variant="danger">
                                            Empty
                                        </b-badge>
                                    </b-td>
                                    <b-td>
                                        0 kg
                                    </b-td>
                                    <b-td colspan="4">
                                        <b-button
                                            v-if="
                                                box.index !== 0 &&
                                                    trailingFullBox
                                            "
                                            class="w-100"
                                            variant="primary"
                                            @click="swapBoxes(box)"
                                            size="sm"
                                        >
                                            Swap with box
                                            {{ trailingFullBox.index }}
                                        </b-button>
                                    </b-td>
                                </b-tr>
                                <b-tr
                                    v-for="(purchaseOrderProduct,
                                    boxSubIndex) in box.purchaseOrderProducts"
                                    :key="
                                        `${purchaseOrderProduct.id}-${box.id}`
                                    "
                                >
                                    <b-td
                                        v-if="boxSubIndex === 0"
                                        :rowspan="
                                            box.purchaseOrderProducts.length
                                        "
                                    >
                                        {{ box.index }}
                                        <b-badge
                                            v-if="box.index === 0"
                                            variant="danger"
                                            >Unboxed</b-badge
                                        ></b-td
                                    >
                                    <b-td
                                        v-if="boxSubIndex === 0"
                                        :rowspan="
                                            box.purchaseOrderProducts.length
                                        "
                                    >
                                        {{ boxWeight(box) }} kg
                                    </b-td>
                                    <b-td>
                                        {{ purchaseOrderProduct.sku }}
                                    </b-td>
                                    <b-td>
                                        {{
                                            purchaseOrderProduct.purchaseOrderId
                                        }}
                                    </b-td>
                                    <b-td>
                                        {{ purchaseOrderProduct.quantity }}
                                    </b-td>
                                    <b-td>
                                        <b-button
                                            variant="primary"
                                            :to="
                                                `/shipments/${shipment.id}/allocate?purchaseOrderProductId=${purchaseOrderProduct.id}`
                                            "
                                            size="sm"
                                        >
                                            Change
                                        </b-button>
                                    </b-td>
                                </b-tr>
                            </template>
                        </b-tbody>
                    </b-table-simple>
                </b-col>
            </b-row>
            <b-row v-if="hasEmptyTrailingBoxes">
                <b-col cols="12">
                    <b-button variant="primary" class="w-100">
                        Clear empty trailing boxes
                    </b-button>
                </b-col>
            </b-row>
        </b-card>
    </b-col>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

@Component
export default class Index extends Vue {
    shipment: any = {}
    boxes: any[] = []

    mounted() {
        const tag = this.$newTag()
        this.$registerAction(
            'shipments/update',
            (boxes) => {
                this.boxes = boxes.sort(
                    (a: { index: number }, b: { index: number }) =>
                        a.index - b.index
                )
            },
            tag
        )
        this.$send(
            'shipments/getData',
            {
                shipmentId: this.$route.params.shipmentId
            },
            tag
        ).then((shipment) => {
            this.shipment = shipment
        })
    }

    boxWeight(box: any): number {
        return box.purchaseOrderProducts.reduce(
            (boxWeight: number, purchaseOrderProduct: any) => {
                return boxWeight + purchaseOrderProduct.weight
            },
            0
        )
    }

    close() {
        this.$send('shipments/close', {
            shipmentId: this.shipment.id
        })
    }

    swapBoxes({ id }: { id: number }) {
        this.$send('shipments/boxes/swap', {
            id
        })
    }

    clearEmptyTrailingBoxes() {}

    get totalProfit(): number {
        return this.boxes.reduce((totalProfit: number, box: any) => {
            return (
                totalProfit +
                box.purchaseOrderProducts.reduce(
                    (boxProfit: number, purchaseOrderProduct: any) => {
                        return boxProfit + purchaseOrderProduct.profit
                    },
                    0
                )
            )
        }, 0)
    }

    get totalWeight(): number {
        return this.boxes.reduce((totalWeight: number, box: any) => {
            return totalWeight + this.boxWeight(box)
        }, 0)
    }

    get hasEmptyTrailingBoxes() {
        if (this.boxes.length === 0) return false
        return (
            this.boxes[this.boxes.length - 1].purchaseOrderProducts.length === 0
        )
    }

    get closeError() {
        if (this.hasEmptyTrailingBoxes) return 'Has empty trailing boxes'
        if (this.hasEmptyMidBoxes) return 'Has empty boxes mid shipment'
    }

    get hasEmptyMidBoxes() {
        return this.boxes.some(
            ({ purchaseOrderProducts, index }) =>
                purchaseOrderProducts.length === 0 &&
                index !== 0 &&
                index < this.trailingFullBox.index
        )
    }

    get trailingFullBox() {
        return [...this.boxes]
            .reverse()
            .find(
                ({ purchaseOrderProducts }) => purchaseOrderProducts.length > 0
            )
    }
}
</script>

<style scoped></style>
