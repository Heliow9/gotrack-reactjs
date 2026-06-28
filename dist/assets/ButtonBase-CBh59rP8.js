import{r as e}from"./chunk-QTnfLwEv.js";import{E as t,H as n,R as r,T as i,V as a,Y as o,h as s,o as c,u as l,w as u,x as d}from"./index-DCcDlJDJ.js";var f=e(o()),p=0;function m(e){let[t,n]=f.useState(e),r=e||t;return f.useEffect(()=>{t??(p+=1,n(`mui-${p}`))},[t]),r}var h={...f}.useId;function g(e){if(h!==void 0){let t=h();return e??t}return m(e)}var _=g;function v(e){let t=f.useRef(e);return d(()=>{t.current=e}),f.useRef((...e)=>(0,t.current)(...e)).current}var y=v;function b(...e){let t=f.useRef(void 0),n=f.useCallback(t=>{let n=e.map(e=>{if(e==null)return null;if(typeof e==`function`){let n=e,r=n(t);return typeof r==`function`?r:()=>{n(null)}}return e.current=t,()=>{e.current=null}});return()=>{n.forEach(e=>e?.())}},e);return f.useMemo(()=>e.every(e=>e==null)?null:e=>{t.current&&=(t.current(),void 0),e!=null&&(t.current=n(e))},e)}var x=b;function S(e,t){if(e==null)return{};var n={};for(var r in e)if({}.hasOwnProperty.call(e,r)){if(t.indexOf(r)!==-1)continue;n[r]=e[r]}return n}function C(e,t){return C=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},C(e,t)}function w(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,C(e,t)}var T=f.createContext(null);function E(e){if(e===void 0)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return e}function D(e,t){var n=function(e){return t&&(0,f.isValidElement)(e)?t(e):e},r=Object.create(null);return e&&f.Children.map(e,function(e){return e}).forEach(function(e){r[e.key]=n(e)}),r}function O(e,t){e||={},t||={};function n(n){return n in t?t[n]:e[n]}var r=Object.create(null),i=[];for(var a in e)a in t?i.length&&(r[a]=i,i=[]):i.push(a);var o,s={};for(var c in t){if(r[c])for(o=0;o<r[c].length;o++){var l=r[c][o];s[r[c][o]]=n(l)}s[c]=n(c)}for(o=0;o<i.length;o++)s[i[o]]=n(i[o]);return s}function k(e,t,n){return n[t]==null?e.props[t]:n[t]}function A(e,t){return D(e.children,function(n){return(0,f.cloneElement)(n,{onExited:t.bind(null,n),in:!0,appear:k(n,`appear`,e),enter:k(n,`enter`,e),exit:k(n,`exit`,e)})})}function ee(e,t,n){var r=D(e.children),i=O(t,r);return Object.keys(i).forEach(function(a){var o=i[a];if((0,f.isValidElement)(o)){var s=a in t,c=a in r,l=t[a],u=(0,f.isValidElement)(l)&&!l.props.in;c&&(!s||u)?i[a]=(0,f.cloneElement)(o,{onExited:n.bind(null,o),in:!0,exit:k(o,`exit`,e),enter:k(o,`enter`,e)}):!c&&s&&!u?i[a]=(0,f.cloneElement)(o,{in:!1}):c&&s&&(0,f.isValidElement)(l)&&(i[a]=(0,f.cloneElement)(o,{onExited:n.bind(null,o),in:l.props.in,exit:k(o,`exit`,e),enter:k(o,`enter`,e)}))}}),i}var j=Object.values||function(e){return Object.keys(e).map(function(t){return e[t]})},M={component:`div`,childFactory:function(e){return e}},N=function(e){w(t,e);function t(t,n){var r=e.call(this,t,n)||this;return r.state={contextValue:{isMounting:!0},handleExited:r.handleExited.bind(E(r)),firstRender:!0},r}var r=t.prototype;return r.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},r.componentWillUnmount=function(){this.mounted=!1},t.getDerivedStateFromProps=function(e,t){var n=t.children,r=t.handleExited;return{children:t.firstRender?A(e,r):ee(e,n,r),firstRender:!1}},r.handleExited=function(e,t){var r=D(this.props.children);e.key in r||(e.props.onExited&&e.props.onExited(t),this.mounted&&this.setState(function(t){var r=n({},t.children);return delete r[e.key],{children:r}}))},r.render=function(){var e=this.props,t=e.component,n=e.childFactory,r=S(e,[`component`,`childFactory`]),i=this.state.contextValue,a=j(this.state.children).map(n);return delete r.appear,delete r.enter,delete r.exit,t===null?f.createElement(T.Provider,{value:i},a):f.createElement(T.Provider,{value:i},f.createElement(t,r,a))},t}(f.Component);N.propTypes={},N.defaultProps=M;var P={};function F(e,t){let n=f.useRef(P);return n.current===P&&(n.current=e(t)),n}var I=[];function L(e){f.useEffect(e,I)}var R=class e{static create(){return new e}currentId=null;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=null,t()},e)}clear=()=>{this.currentId!==null&&(clearTimeout(this.currentId),this.currentId=null)};disposeEffect=()=>this.clear};function z(){let e=F(R.create).current;return L(e.disposeEffect),e}function B(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var V=class e{static create(){return new e}static use(){let t=F(e.create).current,[n,r]=f.useState(!1);return t.shouldMount=n,t.setShouldMount=r,f.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=H(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}};function te(){return V.use()}function H(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}var U=r();function W(e){let{className:n,classes:r,pulsate:i=!1,rippleX:a,rippleY:o,rippleSize:s,in:c,onExited:l,timeout:u}=e,[d,p]=f.useState(!1),m=t(n,r.ripple,r.rippleVisible,i&&r.ripplePulsate),h={width:s,height:s,top:-(s/2)+o,left:-(s/2)+a},g=t(r.child,d&&r.childLeaving,i&&r.childPulsate);return!c&&!d&&p(!0),f.useEffect(()=>{if(!c&&l!=null){let e=setTimeout(l,u);return()=>{clearTimeout(e)}}},[l,c,u]),(0,U.jsx)(`span`,{className:m,style:h,children:(0,U.jsx)(`span`,{className:g})})}var G=u(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`]),K=550,q=a`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,J=a`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,Y=a`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,ne=l(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),re=l(W,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${G.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${q};
    animation-duration: ${K}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  &.${G.ripplePulsate} {
    animation-duration: ${({theme:e})=>e.transitions.duration.shorter}ms;
  }

  & .${G.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${G.childLeaving} {
    opacity: 0;
    animation-name: ${J};
    animation-duration: ${K}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  & .${G.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${Y};
    animation-duration: 2500ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`,ie=f.forwardRef(function(e,n){let{center:r=!1,classes:i={},className:a,...o}=c({props:e,name:`MuiTouchRipple`}),[s,l]=f.useState([]),u=f.useRef(0),d=f.useRef(null);f.useEffect(()=>{d.current&&=(d.current(),null)},[s]);let p=f.useRef(!1),m=z(),h=f.useRef(null),g=f.useRef(null),_=f.useCallback(e=>{let{pulsate:n,rippleX:r,rippleY:a,rippleSize:o,cb:s}=e;l(e=>[...e,(0,U.jsx)(re,{classes:{ripple:t(i.ripple,G.ripple),rippleVisible:t(i.rippleVisible,G.rippleVisible),ripplePulsate:t(i.ripplePulsate,G.ripplePulsate),child:t(i.child,G.child),childLeaving:t(i.childLeaving,G.childLeaving),childPulsate:t(i.childPulsate,G.childPulsate)},timeout:K,pulsate:n,rippleX:r,rippleY:a,rippleSize:o},u.current)]),u.current+=1,d.current=s},[i]),v=f.useCallback((e={},t={},n=()=>{})=>{let{pulsate:i=!1,center:a=r||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&p.current){p.current=!1;return}e?.type===`touchstart`&&(p.current=!0);let s=o?null:g.current,c=s?s.getBoundingClientRect():{width:0,height:0,left:0,top:0},l,u,d;if(a||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)l=Math.round(c.width/2),u=Math.round(c.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;l=Math.round(t-c.left),u=Math.round(n-c.top)}if(a)d=Math.sqrt((2*c.width**2+c.height**2)/3),d%2==0&&(d+=1);else{let e=Math.max(Math.abs((s?s.clientWidth:0)-l),l)*2+2,t=Math.max(Math.abs((s?s.clientHeight:0)-u),u)*2+2;d=Math.sqrt(e**2+t**2)}e?.touches?h.current===null&&(h.current=()=>{_({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:n})},m.start(80,()=>{h.current&&=(h.current(),null)})):_({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:n})},[r,_,m]),y=f.useCallback(()=>{v({},{pulsate:!0})},[v]),b=f.useCallback((e,t)=>{if(m.clear(),e?.type===`touchend`&&h.current){h.current(),h.current=null,m.start(0,()=>{b(e,t)});return}h.current=null,l(e=>e.length>0?e.slice(1):e),d.current=t},[m]);return f.useImperativeHandle(n,()=>({pulsate:y,start:v,stop:b}),[y,v,b]),(0,U.jsx)(ne,{className:t(G.root,i.root,a),ref:g,...o,children:(0,U.jsx)(N,{component:null,exit:!0,children:s})})});function ae(e){return i(`MuiButtonBase`,e)}var oe=u(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`]),se=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,classes:i}=e,a=s({root:[`root`,t&&`disabled`,n&&`focusVisible`]},ae,i);return n&&r&&(a.root+=` ${r}`),a},ce=l(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${oe.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),le=f.forwardRef(function(e,n){let r=c({props:e,name:`MuiButtonBase`}),{action:i,centerRipple:a=!1,children:o,className:s,component:l=`button`,disabled:u=!1,disableRipple:d=!1,disableTouchRipple:p=!1,focusRipple:m=!1,focusVisibleClassName:h,LinkComponent:g=`a`,onBlur:_,onClick:v,onContextMenu:b,onDragLeave:S,onFocus:C,onFocusVisible:w,onKeyDown:T,onKeyUp:E,onMouseDown:D,onMouseLeave:O,onMouseUp:k,onTouchEnd:A,onTouchMove:ee,onTouchStart:j,tabIndex:M=0,TouchRippleProps:N,touchRippleRef:P,type:F,...I}=r,L=f.useRef(null),R=te(),z=x(R.ref,P),[V,H]=f.useState(!1);u&&V&&H(!1),f.useImperativeHandle(i,()=>({focusVisible:()=>{H(!0),L.current.focus()}}),[]);let W=R.shouldMount&&!d&&!u;f.useEffect(()=>{V&&m&&!d&&R.pulsate()},[d,m,V,R]);let G=X(R,`start`,D,p),K=X(R,`stop`,b,p),q=X(R,`stop`,S,p),J=X(R,`stop`,k,p),Y=X(R,`stop`,e=>{V&&e.preventDefault(),O&&O(e)},p),ne=X(R,`start`,j,p),re=X(R,`stop`,A,p),ae=X(R,`stop`,ee,p),oe=X(R,`stop`,e=>{B(e.target)||H(!1),_&&_(e)},!1),le=y(e=>{L.current||=e.currentTarget,B(e.target)&&(H(!0),w&&w(e)),C&&C(e)}),Z=()=>{let e=L.current;return l&&l!==`button`&&!(e.tagName===`A`&&e.href)},ue=y(e=>{m&&!e.repeat&&V&&e.key===` `&&R.stop(e,()=>{R.start(e)}),e.target===e.currentTarget&&Z()&&e.key===` `&&e.preventDefault(),T&&T(e),e.target===e.currentTarget&&Z()&&e.key===`Enter`&&!u&&(e.preventDefault(),v&&v(e))}),de=y(e=>{m&&e.key===` `&&V&&!e.defaultPrevented&&R.stop(e,()=>{R.pulsate(e)}),E&&E(e),v&&e.target===e.currentTarget&&Z()&&e.key===` `&&!e.defaultPrevented&&v(e)}),Q=l;Q===`button`&&(I.href||I.to)&&(Q=g);let $={};Q===`button`?($.type=F===void 0?`button`:F,$.disabled=u):(!I.href&&!I.to&&($.role=`button`),u&&($[`aria-disabled`]=u));let fe=x(n,L),pe={...r,centerRipple:a,component:l,disabled:u,disableRipple:d,disableTouchRipple:p,focusRipple:m,tabIndex:M,focusVisible:V},me=se(pe);return(0,U.jsxs)(ce,{as:Q,className:t(me.root,s),ownerState:pe,onBlur:oe,onClick:v,onContextMenu:K,onFocus:le,onKeyDown:ue,onKeyUp:de,onMouseDown:G,onMouseLeave:Y,onMouseUp:J,onDragLeave:q,onTouchEnd:re,onTouchMove:ae,onTouchStart:ne,ref:fe,tabIndex:u?-1:M,type:F,...$,...I,children:[o,W?(0,U.jsx)(ie,{ref:z,center:a,...N}):null]})});function X(e,t,n,r=!1){return y(i=>(n&&n(i),r||e[t](i),!0))}export{T as a,x as c,v as d,_ as f,z as i,b as l,B as n,w as o,g as p,R as r,S as s,le as t,y as u};