namespace AstalToplevel {
/** Check whether the wlr_foreign_toplevel_manager_v1 protocol is supported. */
public bool is_supported() {
    return !AstalWl.Registry.get_default().find_globals("zwlr_foreign_toplevel_manager_v1").is_empty();
}

public ToplevelManager get_default() {
    return ToplevelManager.get_default();
}

/**
 * The global list of open toplevels (windows). As a ListModel, it exposes
 * every toplevel; each one is also reachable through the `toplevels` property.
 */
public class ToplevelManager : Object, ListModel {
    private static ToplevelManager? instance;

    public static unowned ToplevelManager get_default() {
        if (instance == null) {
            instance = new ToplevelManager();
        }
        return instance;
    }

    private ZwlrForeignToplevelManagerV1? manager;
    public GenericArray<Toplevel> toplevels { get; private set; }
    /**
     * The currently activated (focused) toplevel, or null if none.
     */
    public Toplevel? focused { get; private set; default = null; }

    /**
     * Emitted whenever a toplevel is added or removed.
     */
    public signal void updated();

    private const ZwlrForeignToplevelManagerV1Listener manager_listener = {
        handle_toplevel,
        handle_finished,
    };

    public Object? get_item(uint position) {
        if (position >= toplevels.length) {
            return null;
        } else {
            return toplevels[position];
        }
    }

    public Type item_type {
        get {
            return typeof(Toplevel);
        }
    }

    public Type get_item_type() {
        return typeof(Toplevel);
    }

    public uint n_items {
        get {
            return toplevels.length;
        }
    }

    public uint get_n_items() {
        return toplevels.length;
    }

    public ToplevelManager() {
        toplevels = new GenericArray<Toplevel>();

        var registry = AstalWl.get_default();
        var global = registry.find_globals("zwlr_foreign_toplevel_manager_v1").nth_data(0);
        if (global == null) {
            critical("The compositor does not support wlr_foreign_toplevel_manager_v1");
            return;
        }
        manager = registry.get_registry().bind(global.name, ref ZwlrForeignToplevelManagerV1.iface, uint.min(global.version, 3));
        manager.add_listener(manager_listener, this);
    }

    private void handle_toplevel(ZwlrForeignToplevelManagerV1 manager, ZwlrForeignToplevelHandleV1 handle) {
        debug("create toplevel %p", handle);
        var toplevel = new Toplevel(this, handle);
        toplevel.notify["activated"].connect(() => {
            if (toplevel.activated && focused != toplevel) {
                focused = toplevel;
            } else if (!toplevel.activated && focused == toplevel) {
                focused = null;
            }
        });
        toplevels.add(toplevel);
        items_changed(toplevels.length - 1, 0, 1);
        updated();
    }

    private void handle_finished(ZwlrForeignToplevelManagerV1 manager) {
        warning("foreign toplevel manager finished");
    }

    internal void handle_toplevel_closed(Toplevel toplevel) {
        debug("destroy toplevel %p", toplevel);
        if (focused == toplevel) {
            focused = null;
        }
        uint index;
        if (toplevels.find(toplevel, out index)) {
            toplevels.remove_index(index);
            items_changed(index, 1, 0);
            updated();
        }
    }
}
}
