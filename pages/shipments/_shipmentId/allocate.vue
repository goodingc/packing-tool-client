<template>
    <b-col cols="12">
        <b-card
            :header="
                `Allocate ${purchaseOrderProduct.sku} in PO# ${purchaseOrderProduct.purchaseOrderId} to shipment ${shipment.id}`
            "
        >
            <b-row class="mb-2">
                <b-col cols="6">Title: {{ purchaseOrderProduct.title }}</b-col>
                <b-col cols="3">FC: {{ shipment.fulfillmentCenterId }}</b-col>
                <b-col cols="3">
                    <b-button
                        class="w-100"
                        variant="secondary"
                        :to="'/shipments/' + shipment.id"
                    >
                        Go to shipment
                    </b-button>
                </b-col>
            </b-row>
            <b-row class="mb-3">
                <b-col cols="6">
                    Allocated in this shipment:
                    <h4 class="d-inline">
                        <b-badge :variant="allocatedStyle">{{
                            liveShipmentAllocation
                        }}</b-badge>
                        /
                        <b-badge variant="secondary">{{
                            toBeAllocated
                        }}</b-badge>
                    </h4>
                    (accepted: {{ purchaseOrderProduct.acceptedQuantity }},
                    otherwise allocated: {{ otherwiseAllocated }})
                </b-col>
                <b-col cols="3">
                    <b-button class="w-100" variant="danger" @click="revert"
                        >Revert</b-button
                    >
                </b-col>
                <b-col cols="3">
                    <b-button
                        :disabled="liveShipmentAllocation > 100"
                        class="w-100"
                        variant="primary"
                        @click="save"
                        >Save</b-button
                    >
                </b-col>
            </b-row>
            <b-row class="mb-3">
                <b-col cols="12">
                    <b-table :items="boxes" :fields="tableFields">
                        <template
                            v-slot:cell(index)="{
                                item: {
                                    index,
                                    productQuantity,
                                    liveProductQuantity,
                                    otherwiseEmpty
                                }
                            }"
                        >
                            {{ index }}
                            <b-badge v-if="index === 0" variant="secondary"
                                >Unboxed</b-badge
                            >
                            <b-badge
                                v-if="
                                    otherwiseEmpty && liveProductQuantity === 0
                                "
                                variant="success"
                            >
                                Empty
                            </b-badge>
                            <b-badge
                                v-if="liveProductQuantity !== productQuantity"
                                variant="info"
                            >
                                Changed
                            </b-badge>
                        </template>
                        <template v-slot:cell(allocate)="data">
                            <b-input-group>
                                <b-form-input
                                    v-model.number="
                                        data.item.liveProductQuantity
                                    "
                                    type="number"
                                    min="0"
                                />
                                <b-input-group-append>
                                    <b-button
                                        variant="primary"
                                        @click="
                                            data.item.liveProductQuantity += toBeAllocated
                                        "
                                    >
                                        Add all
                                    </b-button>
                                </b-input-group-append>
                            </b-input-group>
                        </template>
                    </b-table>
                </b-col>
            </b-row>
            <b-row class="mb-3">
                <b-col cols="4">
                    <b-button
                        class="w-100"
                        variant="primary"
                        @click="addBoxes(0, 1)"
                        :disabled="hasEmptyBoxes"
                        >Add Single Empty Box</b-button
                    >
                </b-col>
                <b-col cols="8">
                    <b-input-group>
                        <b-input-group-text
                            >Quantity per box</b-input-group-text
                        >
                        <b-form-input
                            v-model.number="multiBox.quantity"
                            min="1"
                            type="number"
                        />
                        <b-input-group-text>Amount of boxes</b-input-group-text>
                        <b-form-input
                            v-model.number="multiBox.amount"
                            min="1"
                            type="number"
                        />
                        <b-input-group-append>
                            <b-button
                                variant="primary"
                                @click="
                                    addBoxes(multiBox.quantity, multiBox.amount)
                                "
                                >Add Multiple Boxes</b-button
                            >
                        </b-input-group-append>
                    </b-input-group>
                </b-col>
            </b-row>
        </b-card>
    </b-col>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

@Component
export default class Allocate extends Vue {
    boxes: any[] = []
    shipment: any = {}
    purchaseOrderProduct: any = {}

    otherwiseAllocated: number = 0

    multiBox = {
        quantity: 1,
        amount: 1
    }

    tableFields = [
        {
            key: 'index'
        },
        {
            key: 'allocate',
            label: 'Allocated'
        }
    ]

    mounted() {
        const tag = this.$newTag()
        this.$registerAction(
            'shipments/allocate/update',
            (boxes) => {
                this.boxes = boxes.map((box: any) => {
                    const oldBox = this.boxes.filter(
                        (oldBox) => oldBox.id === box.id
                    )[0]
                    return Object.assign(box, {
                        liveProductQuantity: oldBox
                            ? oldBox.liveProductQuantity
                            : box.productQuantity
                    })
                })
            },
            tag
        )
        this.$send(
            'shipments/allocate/getData',
            {
                shipmentId: parseInt(this.$route.params.shipmentId),
                purchaseOrderProductId: parseInt(
                    <string>this.$route.query.purchaseOrderProductId
                )
            },
            tag
        ).then(({ shipment, purchaseOrderProduct, otherwiseAllocated }) => {
            this.shipment = shipment
            this.purchaseOrderProduct = purchaseOrderProduct
            this.otherwiseAllocated = otherwiseAllocated
        })
    }

    revert(): void {
        this.boxes.forEach((box) => {
            box.liveProductQuantity = box.productQuantity
        })
    }

    addBoxes(boxQuantity: number, boxAmount: number): void {
        this.$send('shipments/addBoxes', {
            shipmentId: this.shipment.id,
            boxQuantity,
            boxAmount,
            purchaseOrderProductId: this.purchaseOrderProduct.id
        })
    }

    save(): void {
        this.$send('shipments/allocate/save', {
            purchaseOrderProductId: this.purchaseOrderProduct.id,
            boxes: this.boxes.map(({ id, liveProductQuantity }) => {
                return {
                    id,
                    quantity: liveProductQuantity
                }
            })
        })
    }

    get liveShipmentAllocation(): number {
        return this.boxes.reduce(
            (allocatedQuantity, { liveProductQuantity }) =>
                allocatedQuantity + liveProductQuantity,
            0
        )
    }

    get allocatedStyle(): string {
        if (this.liveShipmentAllocation === 0) {
            return 'danger'
        } else if (this.liveShipmentAllocation === this.toBeAllocated) {
            return 'success'
        } else if (this.liveShipmentAllocation > this.toBeAllocated) {
            return 'danger'
        }
        return 'warning'
    }

    get toBeAllocated(): number {
        return (
            this.purchaseOrderProduct.acceptedQuantity - this.otherwiseAllocated
        )
    }

    get hasEmptyBoxes(): boolean {
        return (
            this.boxes.reduce((hasEmptyBox: boolean, box) => {
                return (
                    hasEmptyBox ||
                    (box.liveProductQuantity === 0 &&
                        box.otherwiseEmpty &&
                        box.index !== 0)
                )
            }, false) === true
        )
    }
}
</script>

<style scoped></style>
