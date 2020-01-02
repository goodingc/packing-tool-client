<template>
    <b-col cols="12">
        <b-card header="Title">
            <b-row>
                <b-col cols="12">
                    <b-input-group class="mb-3">
                        <b-input-group-prepend>
                            <b-form-select
                                :options="fulfillmentCenterOptions"
                                v-model="fulfillmentCenterFilter"
                            >
                            </b-form-select>
                        </b-input-group-prepend>
                        <b-form-input
                            v-model="omniFilter"
                            placeholder="Title, SKU, PO # or EAN"
                        ></b-form-input>
                        <b-input-group-append>
                            <b-button
                                :variant="
                                    showColumns.purchaseOrderId
                                        ? 'secondary'
                                        : 'outline-secondary'
                                "
                                :pressed.sync="showColumns.purchaseOrderId"
                                >PO #
                            </b-button>
                            <b-button
                                :variant="
                                    showColumns.title
                                        ? 'secondary'
                                        : 'outline-secondary'
                                "
                                :pressed.sync="showColumns.title"
                                >Title
                            </b-button>
                            <b-button
                                :variant="
                                    showColumns.deliveryWindow
                                        ? 'secondary'
                                        : 'outline-secondary'
                                "
                                :pressed.sync="showColumns.deliveryWindow"
                                >Delivery Window
                            </b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-col>
            </b-row>
            <b-row>
                <b-col cols="12">
                    <b-table
                        ref="table"
                        sticky-header="calc(100vh - 235px)"
                        small
                        striped
                        :items="filteredPackingList"
                        :busy="packingList.length === 0"
                        :fields="tableFields"
                    >
                        <template v-slot:table-busy>
                            <div class="text-center text-danger my-2">
                                <b-spinner class="align-middle"></b-spinner>
                                <strong>Loading...</strong>
                            </div>
                        </template>

                        <template
                            v-slot:cell(deliveryWindow)="{
                                item: { purchaseOrder: { deliveryWindow } }
                            }"
                        >
                            {{ deliveryWindow.start.format('DD/MM') }}
                            -
                            {{ deliveryWindow.end.format('DD/MM') }}
                        </template>

                        <template
                            v-slot:cell(prepRequired)="{
                                item: { id, prepRequired }
                            }"
                        >
                            <template v-if="prepRequired">
                                <font-awesome-icon
                                    :id="`prep-required-${id}`"
                                    class="text-danger"
                                    icon="exclamation-circle"
                                    size="2x"
                                ></font-awesome-icon>
                                <b-popover
                                    :target="`prep-required-${id}`"
                                    triggers="hover focus"
                                    variant="danger"
                                    placement="left"
                                >
                                    <template v-slot:title
                                        >Prep Required
                                    </template>
                                    {{ prepRequired }}
                                </b-popover>
                            </template>
                        </template>

                        <template v-slot:cell(allocated)="{ item }">
                            <h4 class="mb-0" style="min-width: 100px">
                                <b-badge :variant="allocatedVariant(item)"
                                    >{{ item.allocatedQuantity }}
                                </b-badge>
                                /
                                <b-badge variant="secondary">
                                    {{ item.acceptedQuantity }}
                                </b-badge>
                            </h4>
                        </template>

                        <template
                            v-slot:cell(allocate)="{
                                item: {
                                    id,
                                    purchaseOrder: {
                                        fulfillmentCenter: {
                                            activeShipmentId
                                        }
                                    }
                                }
                            }"
                        >
                            <b-button
                                variant="primary"
                                :to="
                                    `shipments/${activeShipmentId}/allocate?purchaseOrderProductId=${id}`
                                "
                                >Allocate</b-button
                            >
                        </template>
                    </b-table>
                </b-col>
            </b-row>
        </b-card>
    </b-col>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'
import moment from 'moment'

@Component
export default class Index extends Vue {
    fulfillmentCenters: any[] = []
    packingList: any[] = []

    omniFilter: string = ''
    fulfillmentCenterFilter: string = '*'

    showColumns = {
        purchaseOrderId: false,
        title: true,
        deliveryWindow: true
    }

    mounted() {
        this.$send('models/selectAll', {
            model: 'fulfillmentCenters'
        }).then((fulfillmentCenters) => {
            this.fulfillmentCenters = fulfillmentCenters
        })

        this.$send('packingList/get').then((packingList) => {
            for (const packingListItem of packingList) {
                packingListItem.purchaseOrder.deliveryWindow.start = moment(
                    packingListItem.purchaseOrder.deliveryWindow.start
                )
                packingListItem.purchaseOrder.deliveryWindow.end = moment(
                    packingListItem.purchaseOrder.deliveryWindow.end
                )
            }
            this.packingList = packingList
        })
    }

    allocatedVariant({
        allocatedQuantity,
        acceptedQuantity
    }: {
        allocatedQuantity: number
        acceptedQuantity: number
    }) {
        let variant = 'warning'
        if (allocatedQuantity === 0) {
            variant = 'danger'
        } else if (allocatedQuantity === acceptedQuantity) {
            variant = 'success'
        } else if (allocatedQuantity > acceptedQuantity) {
            variant = 'danger'
        }
        return variant
    }

    get fulfillmentCenterOptions(): string[] {
        return [
            {
                value: '*',
                text: 'All'
            },
            ...this.fulfillmentCenters.map(({ id }) => id)
        ]
    }

    get tableFields(): any[] {
        return [
            this.showColumns.purchaseOrderId && {
                key: 'purchaseOrder.id',
                label: 'PO #',
                sortable: true
            },
            {
                key: 'sku',
                label: 'SKU',
                sortable: true,
                sortDirection: 'asc'
            },
            this.showColumns.title && {
                key: 'title',
                sortable: true
            },
            this.showColumns.deliveryWindow && {
                key: 'deliveryWindow'
            },
            {
                key: 'ean',
                label: 'EAN'
            },
            {
                key: 'purchaseOrder.fulfillmentCenter.id',
                label: 'FC'
            },
            {
                key: 'prepRequired',
                label: ''
            },
            {
                key: 'allocated'
            },
            {
                key: 'allocate'
            }
        ]
    }

    get filteredPackingList(): any[] {
        const omni = this.omniFilter.toLowerCase()
        const fcFiltered =
            this.fulfillmentCenterFilter === '*'
                ? this.packingList
                : this.packingList.filter(
                      ({
                          purchaseOrder: {
                              fulfillmentCenter: { id }
                          }
                      }) => id === this.fulfillmentCenterFilter
                  )
        return omni === ''
            ? fcFiltered
            : fcFiltered.filter(({ purchaseOrder, sku, title, ean }) => {
                  return (
                      purchaseOrder.id.toLowerCase().includes(omni) ||
                      (sku && sku.toLowerCase().includes(omni)) ||
                      (title && title.toLowerCase().includes(omni)) ||
                      (ean && ean.toLowerCase().includes(omni))
                  )
              })
    }
}
</script>

<style scoped></style>
