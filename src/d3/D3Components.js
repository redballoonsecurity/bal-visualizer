export default class D3Components {
    constructor() {
        this._views = new Map();
        this._scalers = new Map();
        this._tilers = new Map();
    }

    addViews(views) {
        views.forEach(view => {
            this._views.set(view.name, view)
        })
    }

    getView(name) {
        const view = this._views.get(name);
        if (view == null) {
            throw Error(`No view named ${name} is registered`)
        }
        return view
    }

    addScalers(scalers) {
        scalers.forEach(renderer => {
            this._scalers.set(renderer.name, renderer)
        })
    }

    getScaler(name) {
        const scaler = this._scalers.get(name);
        if (scaler == null) {
            throw Error(`No scaler named ${name} is registered`)
        }
        return scaler
    }

    addTilers(tilers) {
        tilers.forEach(renderer => {
            this._tilers.set(renderer.name, renderer)
        })
    }

    getTiler(name) {
        const tiler = this._tilers.get(name);
        if (tiler == null) {
            throw Error(`No tiler named ${name} is registered`)
        }
        return tiler
    }
}