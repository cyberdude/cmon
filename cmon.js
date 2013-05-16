/*!
 * @link        github.com/ryanve/cmon
 * @license     MIT
 * @copyright   2013 Ryan Van Etten
 * @version     0.2.1
 */

/*jshint expr:true, laxcomma:true, supernew:true, debug:true, eqnull:true, node:true, boss:true, evil:true,
  undef:true, unused:true, sub:true, browser:true, devel:true, jquery:true, indent:4, maxerr:100 */

(function(root, name, make) {
    if (typeof module != 'undefined' && module['exports']) {
        module['exports'] = make.call(root);
    } else {
        root[name] = make = make.call(root);
        make['id'] = name;
        root['require'] || make['claim']('require', make['require'], root);
        root['provide'] || make['claim']('provide', make['provide'], root);
        make['provide'](name, make);
    }
}(this, 'cmon', function() {

    var root = this || window
      , modules = {}
      , claimed = {}
      , owns = claimed.hasOwnProperty;

    /**
     * @param  {string|number} id
     * @link   wiki.commonjs.org/wiki/Modules/1.1.1
     */
    function require(id) {
        if (null == id) throw new TypeError('@require');
        return (owns.call(modules, id) ? modules : root)[id];
    }

    /**
     * @param  {string|number} id
     * @param  {*=}            value
     */
    function provide(id, value) {
        if (null == id) throw new TypeError('@provide');
        modules[id] = value;
        provide['trigger'](id);
        return value;
    }

    /**
     * @param  {string|number|Function} id
     * @param  {*=}  value
     */
    function cmon(id, value) {
        if (typeof id != 'function')
            // Check for 2 so that arrays map v/i/a as require
            return 2 == arguments.length ? provide.call(root, id, value) : require.call(root, id);
        // Call callback and return undefined
        id.call(root, cmon);
    }
    
    /**
     * @param  {string|number} id
     * @param  {*=}            value
     * @param  {*=}            scope
     */
    function claim(id, value, scope) {
        if (null == id) throw new TypeError('@claim');
        scope = scope || root;
        claimed[id] = scope[id]; // store previous value
        return scope[id] = value; 
    }
    
    /**
     * @param  {string|number} id
     * @param  {*=}            value
     * @param  {*=}            scope
     */
    function unclaim(id, value, scope) {
        if (null == id) throw new TypeError('@unclaim');
        scope = scope || root;
        if (null == value || value === scope[id])
            scope[id] = owns.call(claimed, id) ? claimed[id] : void 0;
        return value;
    }
    
    /**
     * @this   {Object|Function}
     * @param  {(boolean|Function)=} fn 
     * @return {Object|Function}
     */
    function noConflict(fn) {
        unclaim('provide', provide);
        unclaim('require', require);
        fn && null != this['id'] && unclaim(this['id'], this);
        typeof fn == 'function' && fn.call(root, this); 
        return this;
    }
    
    // Make an on/off/trigger event API for provide()
    (function(target, triggerScope, handlers, owns) {

        /**
         * @param  {Array|Object} fns
         * @param  {*=}           scope
         */
        function callEach(fns, scope) {
            if (!fns) { return; }
            for (var i = 0, l = fns.length; i < l;) {
                if (fns[i++].call(scope) === false) {
                    break;
                }
            }
        }
        
        /**
         * @param  {string|number} id
         */    
        target['trigger'] = function(id) {
            owns.call(handlers, id) && callEach(handlers[id], triggerScope);
        };
    
        /**
         * @param  {string|number} id
         * @param  {Function}      fn
         * @return {number}
         */    
        target['on'] = function(id, fn) {
            if (null == id || typeof fn != 'function') throw new TypeError('@on');
            return (handlers[id] = owns.call(handlers, id) && handlers[id] || []).push(fn);
        };
        
        /**
         * @param  {string|number} id
         * @param  {Function=}     fn
         * @return {number}
         */
        target['off'] = function(id, fn) {
            var fns, i;
            if (null != id) {
                if (void 0 === fn) {
                    handlers[id] = fn; // undefine (remove all)
                } else if (fns = owns.call(handlers, id) && handlers[id]) {
                    for (i = fns.length; i--;) {
                        fn === fns[i] && fns.splice(i, 1);
                    }
                    return fns.length;
                }
            }
            return 0;
        };
        
        return target;
    }(provide, root, {}, owns));

    cmon['provide'] = provide;
    cmon['require'] = require;
    cmon['claim'] = claim;
    cmon['unclaim'] = unclaim;
    cmon['noConflict'] = noConflict;
    return cmon;
}));