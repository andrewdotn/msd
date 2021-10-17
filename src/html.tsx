import React, {ReactElement, Fragment} from "react";
import {renderToStaticMarkup, renderToString} from "react-dom/server";

function boilerplate(props: {title: string, dangerouslySetInnerHTML:
        {__html: string}, bodyClasses?: string}, scripts: string[], stylesheets: string[]) {
    return <html>
    <head>
        <meta charSet="utf8"/>
        <title>{props.title}</title>
        {/* Avoid warning about keys: https://stackoverflow.com/a/53983884/14558 */}
        <Fragment>
        {scripts.map(s => <script src={s}></script>)}
        {stylesheets.map(s => <link rel="stylesheet" href={s}></link>)}
        </Fragment>
    </head>
    <body className={props.bodyClasses} dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}/>
    </html>;
}

export function fullHtmlDocumentWithBody(bodyContents: ReactElement, title='', scripts = ['/dist/bundle.js'], stylesheets: string[] = []) {
    const renderedComponent = renderToString(bodyContents);

    return "<!DOCTYPE html>\n" +
        renderToStaticMarkup(boilerplate({title, dangerouslySetInnerHTML: {__html: renderedComponent}, bodyClasses: 'sticky-footer'}, scripts, stylesheets));
}
