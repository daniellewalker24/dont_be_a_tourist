/**
 * $RCSfile: editor_plugin_src.js,v $
 * $Revision: 1.5 $
 * $Date: 2006/01/23 18:01:36 $
 *
 * Experimental plugin for new Cleanup routine, this logic will be moved into the core ones it's stable enougth.
 *
 * @author Moxiecode
 * @copyright Copyright � 2006, Moxiecode Systems AB, All rights reserved.
 */

function TinyMCE_cleanup_getInfo() {
	return {
		longname : 'Cleanup plugin (Experimental)',
		author : 'Moxiecode Systems',
		authorurl : 'http://tinymce.moxiecode.com',
		infourl : '',
		version : tinyMCE.majorVersion + "." + tinyMCE.minorVersion
	};
};

function TinyMCE_cleanup_urlConverter(c, n, v) {
	if (!c.settings.on_save)
		return tinyMCE.convertRelativeToAbsoluteURL(tinyMCE.settings.base_href, v);
	else if (tinyMCE.getParam('convert_urls'))
		return eval(tinyMCE.settings.urlconverter_callback + "(v, n, true);");

	return v;
};

function TinyMCE_cleanup_initInstance(inst) {
	var c = new TinyMCE_Cleanup();
	var s = inst.settings;

	c.init({
		valid_elements : s.valid_elements,
		extended_valid_elements : s.extended_valid_elements,
		entities : s.entities,
		entity_encoding : s.entity_encoding,
		debug : s.cleanup_debug,
		url_converter : 'TinyMCE_cleanup_urlConverter'
	});

	inst.cleanup = c;
};

TinyMCE.prototype.getContent = function(editor_id) {
	if (typeof(editor_id) != "undefined")
		tinyMCE.selectedInstance = tinyMCE.getInstanceById(editor_id);

	if (tinyMCE.selectedInstance)
		return tinyMCE._cleanupHTML(this.selectedInstance, this.selectedInstance.getDoc(), tinyMCE.settings, this.selectedInstance.getBody(), false, true);

	return null;
};

TinyMCE.prototype._cleanupHTML = function(inst, doc, config, element, visual, on_save) {
	var h, st, c, s;

	on_save = typeof(on_save) == 'undefined' ? false : on_save;

	c = inst.cleanup;
	s = inst.settings;

	if (c.settings.debug)
		st = new Date().getTime();

	// Call custom cleanup code
	tinyMCE._customCleanup(inst, on_save ? "get_from_editor_dom" : "insert_to_editor_dom", doc.body);

	c.settings.on_save = on_save;
	//for (var i=0; i<100; i++)

	c.idCount = 0;
	h = c.serializeNode(element);

	// Post processing
	h = h.replace(/<\/?(body|head|html)[^>]*>/gi, '');
	h = h.replace(/<p><hr \/><\/p>/g, '<hr />');
	h = h.replace(/<p>(&nbsp;|&#160;)<\/p><hr \/><p>(&nbsp;|&#160;)<\/p>/g, '<hr />');
	h = h.replace(/<td>\s*<br \/>\s*<\/td>/g, '<td>&nbsp;</td>');
	h = h.replace(/<p>\s*<br \/>\s*<\/p>/g, '<p>&nbsp;</p>');
	h = h.replace(/<p>\s*(&nbsp;|&#160;)\s*<br \/>\s*(&nbsp;|&#160;)\s*<\/p>/g, '<p>&nbsp;</p>');
	h = h.replace(/<p>\s*(&nbsp;|&#160;)\s*<br \/>\s*<\/p>/g, '<p>&nbsp;</p>');
	h = h.replace(/<p>\s*<br \/>\s*&nbsp;\s*<\/p>/g, '<p>&nbsp;</p>');
	h = h.replace(/<a>(.*?)<\/a>/g, '$1');

	// Clean body
	if (/^\s*(<br \/>|<p>&nbsp;<\/p>|<p>&#160;<\/p>|<p><\/p>)\s*$/.test(h))
		h = '';

	if (s.preformatted)
		h = '<pre>' + h + '</pre>';

	// Gecko specific processing
	if (tinyMCE.isGecko)
		h = h.replace(/<o:p _moz-userdefined="" \/>/g, '');

	if (s.force_br_newlines)
		h = h.replace(/<p>(&nbsp;|&#160;)<\/p>/g, '<br />');

	// Call custom cleanup code
	h = tinyMCE._customCleanup(inst, on_save ? "get_from_editor" : "insert_to_editor", h);

	if (on_save) {
		h = h.replace(new RegExp('(class=".*?) ?(mceItem[a-zA-Z0-9]*|' + s.visual_table_class + ') ?(.*?")', 'g'), '$1$3');
		h = h.replace(new RegExp(' ?class=""', 'g'), '');
	}

	if (s.remove_linebreaks)
		h = h.replace(/\n|\r/g, ' ');

	if (on_save && !s.remove_linebreaks && s.cleanup_indent)
		h = c.formatHTML(h);

	if (c.settings.debug)
		tinyMCE.debug("Cleanup process executed in: " + (new Date().getTime()-st) + " ms.");

	return h;
};

/**
 * TinyMCE_Cleanup class.
 */

function TinyMCE_Cleanup() {
	this.isMSIE = (navigator.appName == "Microsoft Internet Explorer");
	this.rules = new Array();

	// Default config
	this.settings = {
		indent_elements : 'head,table,tbody,thead,tfoot,form,tr,ul,ol,blockquote,object',
		newline_before_elements : 'h1,h2,h3,h4,h5,h6,pre,address,div,ul,ol,li,meta,option,area,title,link,base,script,td',
		newline_after_elements : 'br,hr,p,h1,h2,h3,h4,h5,h6,pre,address,div,ul,ol,meta,option,area,link,base,script',
		newline_before_after_elements : 'html,head,body,table,thead,tbody,tfoot,tr,form,ul,blockquote,p,object,param,hr,div',
		indent_char : '\t',
		indent_levels : 1,
		entity_encoding : 'raw',
		valid_elements : '*[*]',
		entities : "160,nbsp,161,iexcl,162,cent,163,pound,164,curren,165,yen,166,brvbar,167,sect,168,uml,169,copy,170,ordf,171,laquo,172,not,173,shy,174,reg,175,macr,176,deg,177,plusmn,178,sup2,179,sup3,180,acute,181,micro,182,para,183,middot,184,cedil,185,sup1,186,ordm,187,raquo,188,frac14,189,frac12,190,frac34,191,iquest,192,Agrave,193,Aacute,194,Acirc,195,Atilde,196,Auml,197,Aring,198,AElig,199,Ccedil,200,Egrave,201,Eacute,202,Ecirc,203,Euml,204,Igrave,205,Iacute,206,Icirc,207,Iuml,208,ETH,209,Ntilde,210,Ograve,211,Oacute,212,Ocirc,213,Otilde,214,Ouml,215,times,216,Oslash,217,Ugrave,218,Uacute,219,Ucirc,220,Uuml,221,Yacute,222,THORN,223,szlig,224,agrave,225,aacute,226,acirc,227,atilde,228,auml,229,aring,230,aelig,231,ccedil,232,egrave,233,eacute,234,ecirc,235,euml,236,igrave,237,iacute,238,icirc,239,iuml,240,eth,241,ntilde,242,ograve,243,oacute,244,ocirc,245,otilde,246,ouml,247,divide,248,oslash,249,ugrave,250,uacute,251,ucirc,252,uuml,253,yacute,254,thorn,255,yuml,402,fnof,913,Alpha,914,Beta,915,Gamma,916,Delta,917,Epsilon,918,Zeta,919,Eta,920,Theta,921,Iota,922,Kappa,923,Lambda,924,Mu,925,Nu,926,Xi,927,Omicron,928,Pi,929,Rho,931,Sigma,932,Tau,933,Upsilon,934,Phi,935,Chi,936,Psi,937,Omega,945,alpha,946,beta,947,gamma,948,delta,949,epsilon,950,zeta,951,eta,952,theta,953,iota,954,kappa,955,lambda,956,mu,957,nu,958,xi,959,omicron,960,pi,961,rho,962,sigmaf,963,sigma,964,tau,965,upsilon,966,phi,967,chi,968,psi,969,omega,977,thetasym,978,upsih,982,piv,8226,bull,8230,hellip,8242,prime,8243,Prime,8254,oline,8260,frasl,8472,weierp,8465,image,8476,real,8482,trade,8501,alefsym,8592,larr,8593,uarr,8594,rarr,8595,darr,8596,harr,8629,crarr,8656,lArr,8657,uArr,8658,rArr,8659,dArr,8660,hArr,8704,forall,8706,part,8707,exist,8709,empty,8711,nabla,8712,isin,8713,notin,8715,ni,8719,prod,8721,sum,8722,minus,8727,lowast,8730,radic,8733,prop,8734,infin,8736,ang,8743,and,8744,or,8745,cap,8746,cup,8747,int,8756,there4,8764,sim,8773,cong,8776,asymp,8800,ne,8801,equiv,8804,le,8805,ge,8834,sub,8835,sup,8836,nsub,8838,sube,8839,supe,8853,oplus,8855,otimes,8869,perp,8901,sdot,8968,lceil,8969,rceil,8970,lfloor,8971,rfloor,9001,lang,9002,rang,9674,loz,9824,spades,9827,clubs,9829,hearts,9830,diams,34,quot,38,amp,60,lt,62,gt,338,OElig,339,oelig,352,Scaron,353,scaron,376,Yuml,710,circ,732,tilde,8194,ensp,8195,emsp,8201,thinsp,8204,zwnj,8205,zwj,8206,lrm,8207,rlm,8211,ndash,8212,mdash,8216,lsquo,8217,rsquo,8218,sbquo,8220,ldquo,8221,rdquo,8222,bdquo,8224,dagger,8225,Dagger,8240,permil,8249,lsaquo,8250,rsaquo,8364,euro",
		url_converter : ''
	};

	this.vElements = new Array();
	this.vElementsRe = '';
	this.closeElements = /^(IMG|BR|HR|LINK|META|BASE)$/;
	this.codeElementsRe = /^(SCRIPT|STYLE)$/;
	this.mceAttribs = {
		href : 'mce_href',
		src : 'mce_src',
		type : 'mce_type'
	};
}

TinyMCE_Cleanup.prototype = {
	init : function(s) {
		var n, a, i, ir, or, st;

		for (n in s)
			this.settings[n] = s[n];

		// Setup code formating
		s = this.settings;

		// Setup regexps
		this.inRe = this.arrayToRe(s.indent_elements.split(','), '', '^<(', ')[^>]*');
		this.ouRe = this.arrayToRe(s.indent_elements.split(','), '', '^<\\/(', ')[^>]*');
		this.nlBeforeRe = this.arrayToRe(s.newline_before_elements.split(','), 'gi', '<(',  ')([^>]*)>');
		this.nlAfterRe = this.arrayToRe(s.newline_after_elements.split(','), 'gi', '<(',  ')([^>]*)>');
		this.nlBeforeAfterRe = this.arrayToRe(s.newline_before_after_elements.split(','), 'gi', '<(\\/?)(', ')([^>]*)>');

		// Setup separator
		st = '';
		for (i=0; i<s.indent_levels; i++)
			st += s.indent_char;

		this.inStr = st;

		// Setup default rule
		this.addRuleStr(s.valid_elements);
		this.addRuleStr(s.extended_valid_elements);

		// Setup entities
		if (s.entity_encoding == "named") {
			n = new Array();
			a = this.split(',', s.entities);
			for (i=0; i<a.length; i+=2)
				n[a[i]] = a[i+1];

			this.entities = n;
		}

		this.fillStr = this.xmlEncode(String.fromCharCode(160));

		this.idCount = 0;
	},

	arrayToRe : function(a, op, be, af) {
		var i, r;

		op = typeof(op) == "undefined" ? "gi" : op;
		be = typeof(be) == "undefined" ? "^(" : be;
		af = typeof(af) == "undefined" ? ")$" : af;

		r = be;

		for (i=0; i<a.length; i++)
			r += this.wildcardToRe(a[i]) + (i != a.length-1 ? "|" : "");

		r += af;

		return new RegExp(r, op);
	},

	wildcardToRe : function(s) {
		s = s.replace(/\?/g, '(\\S?)');
		s = s.replace(/\+/g, '(\\S+)');
		s = s.replace(/\*/g, '(\\S*)');

		return s;
	},

	addRuleStr : function(s) {
		var r = this.parseRuleStr(s);
		var n;

		for (n in r)
			this.rules[n] = r[n];

		this.vElements = new Array();

		for (n in this.rules)
			this.vElements[this.vElements.length] = this.rules[n].tag;

		this.vElementsRe = this.arrayToRe(this.vElements, '');
	},

	// +tag/tag2[x|y:force|z=default]
	parseRuleStr : function(s) {
		var ta, p, r, a, i, x, px, t, tn, y, av, or = new Array();

		if (s == null || s.length == 0)
			return or;

		ta = s.split(',');
		for (x=0; x<ta.length; x++) {
			s = ta[x];
			if (s.length == 0)
				continue;

			// Split tag/attrs
			p = this.split(/\[|\]/, s);
			if (p == null || p.length < 1)
				t = s.toUpperCase();
			else
				t = p[0].toUpperCase();

			// Handle all tag names
			tn = this.split('/', t);
			for (y=0; y<tn.length; y++) {
				r = {};

				r.tag = tn[y];
				r.forceAttribs = null;
				r.defaultAttribs = null;
				r.validAttribValues = null;

				// Handle prefixes
				px = r.tag.charAt(0);
				r.forceOpen = px == '+';
				r.removeEmpty = px == '-';
				r.fill = px == '#';
				r.tag = r.tag.replace(/\+|-|#/g, '');
				r.oTagName = tn[0].replace(/\+|-|#/g, '').toLowerCase();
				r.isWild = /\*|\?|\+/g.test(r.tag);
				r.validRe = new RegExp(this.wildcardToRe('^' + r.tag + '$'));

				// Setup valid attributes
				if (p.length > 1) {
					r.vAttribsRe = '^(';
					a = this.split(/\|/, p[1]);

					for (i=0; i<a.length; i++) {
						t = a[i];

						av = /(=|:|<)(.*?)$/.exec(t);
						t = t.replace(/(=|:|<).*?$/, '');
						if (av && av.length > 0) {
							if (av[0].charAt(0) == ':') {
								if (!r.forceAttribs)
									r.forceAttribs = new Array();

								r.forceAttribs[t.toLowerCase()] = av[0].substring(1);
							} else if (av[0].charAt(0) == '=') {
								if (!r.defaultAttribs)
									r.defaultAttribs = new Array();

								r.defaultAttribs[t.toLowerCase()] = av[0].substring(1);
							} else if (av[0].charAt(0) == '<') {
								if (!r.validAttribValues)
									r.validAttribValues = new Array();

								r.validAttribValues[t.toLowerCase()] = this.arrayToRe(this.split('?', av[0].substring(1)), '');
							}
						}

						r.vAttribsRe += '' + t.toLowerCase() + (i != a.length - 1 ? '|' : '');

						a[i] = t.toLowerCase();
					}

					r.vAttribsRe += ')$';
					r.vAttribsRe = this.wildcardToRe(r.vAttribsRe);
					r.vAttribsReIsWild = /\*|\?|\+/g.test(r.vAttribsRe);
					r.vAttribsRe = new RegExp(r.vAttribsRe);
					r.vAttribs = a.reverse();

					//tinyMCE.debug(r.tag, r.oTagName, r.vAttribsRe, r.vAttribsReWC);
				} else {
					r.vAttribsRe = '';
					r.vAttribs = new Array();
					r.vAttribsReIsWild = false;
				}

				or[r.tag] = r;
			}
		}

		return or;
	},

	serializeNode : function(n) {
		var en, no, h = '', i, l, r, cn, va = false, f = false, at, hc;

		switch (n.nodeType) {
			case 1: // Element
				hc = n.hasChildNodes();

				if (this.vElementsRe.test(n.nodeName)) {
					va = true;

					r = this.rules[n.nodeName];
					if (!r) {
						at = this.rules;
						for (no in at) {
							if (at[no].validRe.test(n.nodeName)) {
								r = at[no];
								break;
							}
						}
					}

					en = r.isWild ? n.nodeName.toLowerCase() : r.oTagName;
					f = r.fill;

					if (r.removeEmpty && !hc)
						return "";

					h += '<' + en;

					if (r.vAttribsReIsWild) {
						// Serialize wildcard attributes
						at = n.attributes;
						for (i=at.length-1; i>-1; i--) {
							no = at[i];
							if (no.specified && r.vAttribsRe.test(no.nodeName))
								h += this.serializeAttribute(n, r, no.nodeName);
						}
					} else {
						// Serialize specific attributes
						for (i=r.vAttribs.length-1; i>-1; i--)
							h += this.serializeAttribute(n, r, r.vAttribs[i]);
					}

					// Serialize mce_ atts
					if (!this.settings.on_save) {
						at = this.mceAttribs;

						for (no in at)
							h += this.serializeAttribute(n, r, at[no]);
					}

					// Close these
					if (this.closeElements.test(n.nodeName))
						return h + ' />';

					h += '>';

					if (this.isMSIE && this.codeElementsRe.test(n.nodeName))
						h += n.innerHTML;
				}
			break;

			case 3: // Text
				if (n.parentNode && this.codeElementsRe.test(n.parentNode.nodeName))
					return this.isMSIE ? '' : n.nodeValue;

				return this.xmlEncode(n.nodeValue);

			case 8: // Comment
				return "<!--" + n.nodeValue + "-->";
		}

		if (hc) {
			cn = n.childNodes;

			for (i=0, l=cn.length; i<l; i++)
				h += this.serializeNode(cn[i]);
		}

		// Fill empty nodes
		if (f && !hc)
			h += this.fillStr;

		// End element
		if (va)
			h += '</' + en + '>';

		return h;
	},

	serializeAttribute : function(n, r, an) {
		var av = '', t, os = this.settings.on_save;

		if (os && (an.indexOf('mce_') == 0 || an.indexOf('_moz') == 0))
			return '';

		if (os && this.mceAttribs[an])
			av = this.getAttrib(n, this.mceAttribs[an]);

		if (av.length == 0)
			av = this.getAttrib(n, an);

		if (av.length == 0 && r.defaultAttribs && (t = r.defaultAttribs[an]))
			av = t;

		if (r.forceAttribs && (t = r.forceAttribs[an]))
			av = t;

		if (os && av.length != 0 && this.settings.url_converter.length != 0 && /^(src|href|longdesc)$/.test(an))
			av = eval(this.settings.url_converter + '(this, n, av)');

		if (av.length != 0 && r.validAttribValues && r.validAttribValues[an] && !r.validAttribValues[an].test(av))
			return "";

		if (av.length != 0 && av == "{$uid}")
			av = "uid_" + (this.idCount++);

		if (av.length != 0)
			return " " + an + "=" + '"' + this.xmlEncode(av) + '"';

		return "";
	},

	cleanupNode : function(n) {
		var t, h;

		this.idCount = 0;

		h = this.serializeNode(n);
		h = this.formatHTML(h);

		return h;
	},

	formatHTML : function(h) {
		var s = this.settings, p = '', i = 0, li = 0, o = '', l;

		h = '\n' + h;
		h = h.replace(new RegExp('\n' + s.indent_char + '+', 'gi'), '\n'); // Remove previous formatting
		h = h.replace(this.nlBeforeRe, '\n<$1$2>');
		h = h.replace(this.nlAfterRe, '<$1$2>\n');
		h = h.replace(this.nlBeforeAfterRe, '\n<$1$2$3>\n');
		h += '\n';

		//tinyMCE.debug(h);

		while ((i = h.indexOf('\n', i + 1)) != -1) {
			if ((l = h.substring(li + 1, i)).length != 0) {
				if (this.ouRe.test(l) && p.length >= s.indent_levels)
					p = p.substring(s.indent_levels);

				o += p + l + '\n';
	
				if (this.inRe.test(l))
					p += this.inStr;
			}

			li = i;
		}

		//tinyMCE.debug(h);

		return o;
	},

	xmlEncode : function(s) {
		var i, l, e, o = '', c;

		switch (this.settings.entity_encoding) {
			case "raw":
				s = "" + s;
				s = s.replace(/&/g, '&amp;');
				s = s.replace(new RegExp('"', 'g'), '&quot;');
				//s = s.replace(/\'/g, '&apos;');
				s = s.replace(/</g, '&lt;');
				s = s.replace(/>/g, '&gt;');

				return s;

			case "named":
				for (i=0, l=s.length; i<l; i++) {
					c = s.charCodeAt(i);
					e = this.entities[c];

					if (e && e != '')
						o += '&' + e + ';';
					else
						o += String.fromCharCode(c);
				}

				return o;

			case "numeric":
				for (i=0, l=s.length; i<l; i++) {
					c = s.charCodeAt(i);

					if (c > 127 || c == 60 || c == 62 || c == 38 || c == 39 || c == 34)
						o += '&#' + c + ";";
					else
						o += String.fromCharCode(c);
				}

				return o;
		}

		return s;
	},

	split : function(re, s) {
		var c = s.split(re);
		var i, l, o = new Array();

		for (i=0, l=c.length; i<l; i++) {
			if (c[i] != '')
				o[i] = c[i];
		}

		return o;
	},

	getAttrib : function(e, n, d) {
		if (typeof(d) == "undefined")
			d = "";

		if (!e || e.nodeType != 1)
			return d;

		var v = e.getAttribute(n, 0);

		if (n == "class" && !v)
			v = e.className;

		if (this.isMSIE && n == "http-equiv")
			v = e.httpEquiv;

		if (this.isMSIE && /^(colspan|rowspan)$/.test(n) && v == 1)
			return d;

		if (n == "style" && !tinyMCE.isOpera)
			v = e.style.cssText;

		if (n == 'style')
			v = tinyMCE.serializeStyle(tinyMCE.parseStyle(v));

		return (v && v != "") ? '' + v : d;
	}
};
