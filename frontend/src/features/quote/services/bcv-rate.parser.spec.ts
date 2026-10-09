import { describe, expect, it } from 'vitest';

import { getFallbackRate, parseBcvRate } from './bcv-rate.parser';

/**
 * Fixture recortado del HTML publicado por bcv.org.ve el 06/10/2026.
 * Se conserva tal cual —tabulaciones incluidas— porque el parser depende del
 * marcado real, no de una versión simplificada.
 */
const BCV_HTML = `<div id="dolar" class="col-sm-12 col-xs-12 ">
	<div class="field-content">
  		<div class="row recuadrotsmc">
			<div class="col-sm-6 col-xs-6">
  			<img src="/sites/default/files/dollar-04_2.png" class="icono_bss_blanco1">
  		        <span> USD</span>
  		</div>

                         <div class="col-sm-6 col-xs-6 centrado textp"> <strong class="strong-tb">872,39270000</strong>  </div>
	        </div>
        </div>
</div>
          <div class="pull-right dinpro center">
Fecha Valor: <span class="date-display-single" property="dc:date" datatype="xsd:dateTime" content="2026-10-06T00:00:00-04:00">Martes, 06 Octubre  2026</span>
<hr>
</div>`;

describe('parseBcvRate', () => {
  it('extrae la tasa y la fecha del marcado real del BCV', () => {
    expect(parseBcvRate(BCV_HTML)).toEqual({
      rate: 872.3927,
      date: '2026-10-06',
      source: 'BCV',
    });
  });

  it('ignora el resto de las divisas anteriores al bloque del dólar', () => {
    const html = `
      <div><strong class="strong-tb"> 10,22854613</strong></div>
      <div id="dolar"><span> USD</span><strong class="strong-tb">123,45670000</strong></div>
      <div>Fecha Valor: <span content="2026-10-06T00:00:00-04:00">lunes</span></div>`;
    expect(parseBcvRate(html)?.rate).toBe(123.4567);
  });

  it('interpreta la coma como separador decimal', () => {
    const html = `<div id="dolar"><span> USD</span><strong>1,50000000</strong></div>`;
    expect(parseBcvRate(html)?.rate).toBe(1.5);
  });

  it('devuelve null cuando falta el bloque #dolar', () => {
    expect(parseBcvRate('<div><span> USD</span>872,39</div>')).toBeNull();
  });

  it('devuelve null con entradas vacías o no string', () => {
    expect(parseBcvRate('')).toBeNull();
  });

  it('devuelve null cuando no hay valor junto a USD', () => {
    expect(parseBcvRate('<div id="dolar"><span> USD</span></div>')).toBeNull();
  });

  it('devuelve null cuando la tasa queda fuera del rango de sanidad', () => {
    const tooBig = `<div id="dolar"><span> USD</span><strong>999999</strong></div>`;
    const tooSmall = `<div id="dolar"><span> USD</span><strong>0,001</strong></div>`;
    expect(parseBcvRate(tooBig)).toBeNull();
    expect(parseBcvRate(tooSmall)).toBeNull();
  });

  it('no se traga el CSS si el bloque <style> queda sin cerrar en la ventana', () => {
    const html = `${BCV_HTML}\n<style type="text/css">\n  .dinpro { color: red; }\n  /* USD 999999 */
</style>`;
    // El <style> completo se elimina: la tasa sigue siendo la del bloque.
    expect(parseBcvRate(html)?.rate).toBe(872.3927);
  });

  it('lee la fecha desde la etiqueta cuando no existe el atributo content', () => {
    const html = `${BCV_HTML.replace('content="2026-10-06T00:00:00-04:00"', '')}`;
    expect(parseBcvRate(html)?.date).toBe('2026-10-06');
  });

  it('reconoce el mes en inglés', () => {
    const html = `${BCV_HTML
      .replace('content="2026-10-06T00:00:00-04:00"', '')
      .replace('Martes, 06 Octubre  2026', 'Tuesday, 06 October 2026')}`;
    expect(parseBcvRate(html)?.date).toBe('2026-10-06');
  });

  it('devuelve fecha vacía si la etiqueta es ininterpretable, sin descartar la tasa', () => {
    const html = `${BCV_HTML
      .replace('content="2026-10-06T00:00:00-04:00"', '')
      .replace('Martes, 06 Octubre  2026', 'sin fecha')}`;
    const result = parseBcvRate(html);
    expect(result?.rate).toBe(872.3927);
    expect(result?.date).toBe('');
  });
});

describe('getFallbackRate', () => {
  it('devuelve null cuando no hay tasa de respaldo configurada', () => {
    // Sin NEXT_PUBLIC_BCV_FALLBACK_RATE el cotizador prefiere no cotizar
    // en Bolívares antes que publicar un número inventado.
    expect(getFallbackRate()).toBeNull();
  });
});
