import type { MapsPinLoad, Handler } from "@t.addons/index";

const handlers = Symbol("handlers");

export const makeObservable = <T extends object | object[] | MapsPinLoad>(target: T): T => {
    target[handlers] = [];

    target["observe"] = function (handler: Handler) {
        this[handlers].push(handler);
    };

    return new Proxy(target, {
        set(target, property, value, _) {
            const success = Reflect.set(...([target, property, value, _] as const));
            if (success) {
                target[handlers].forEach((handler: Handler) => handler(property, value));
            }
            return success;
        },
    });
};
