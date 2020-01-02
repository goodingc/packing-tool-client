import { Module, Mutation, VuexModule } from '~/node_modules/vuex-module-decorators'
import {Store} from "vuex"

interface StoreType {
    packingListFilters: PackingListFilters
}

const store = new Store<StoreType>({})

@Module({
    name: "packingListFilters",
    store: store,
    dynamic: true
})
export class PackingListFilters extends VuexModule{
    omni: string = ""
    fulfillmentCenterId: string = "*"

    @Mutation
    setOmni(omni: string){
        this.omni = omni
    }

    @Mutation
    setFulfillmentCenterId(fulfillmentCenterId: string){
        this.fulfillmentCenterId = fulfillmentCenterId
    }
}
