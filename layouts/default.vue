<template>
    <b-col cols="12">
        <b-row>
            <b-navbar variation="light">
                <b-navbar-brand to="/">Packing Tool</b-navbar-brand>

                <b-navbar-nav>
                    <b-nav-item to="/import-purchase-orders"
                        >Import Purchase Orders</b-nav-item
                    >
                    <b-nav-item to="/packing-list">Packing List</b-nav-item>
                    <b-nav-item to="/shipments">Shipments</b-nav-item>
                    <b-nav-item to="/stock-take">Stock Take</b-nav-item>
                    <b-nav-item-dropdown text="Inventory">
                        <b-dropdown-item to="/inventory/import">
                            Import
                        </b-dropdown-item>
                        <b-dropdown-item to="/inventory/report">
                            Report
                        </b-dropdown-item>
                    </b-nav-item-dropdown>
                </b-navbar-nav>
            </b-navbar>
        </b-row>
        <b-row>
            <nuxt />
        </b-row>
    </b-col>
</template>
