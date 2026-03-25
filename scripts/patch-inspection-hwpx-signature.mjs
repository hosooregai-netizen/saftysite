/**
 * Patches the inspection HWPX template: removes signature from text placeholders and
 * inserts a small inline picture (binaryItemIDRef=image1) in the 통보 방법 cell for
 * runtime replacement via tplimg22 in hwpxClient.ts.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public/templates/inspection');
const file = fs.readdirSync(dir).find((x) => x.endsWith('.hwpx'));
if (!file) {
  throw new Error(`No .hwpx under ${dir}`);
}
const hwpxPath = path.join(dir, file);
const buf = fs.readFileSync(hwpxPath);
const zip = await JSZip.loadAsync(buf);
let xml = await zip.file('Contents/section0.xml').async('string');

const OLD =
  '{sec2.notification_method_text} / {sec2.notification_recipient_name} / {sec2.notification_recipient_signature} / {sec2.other_notification_method}';
const NEW =
  '{sec2.notification_method_text} / {sec2.notification_recipient_name} / {sec2.other_notification_method}';

if (!xml.includes(OLD)) {
  throw new Error('Expected notification placeholder block not found (already patched?)');
}
xml = xml.replace(OLD, NEW);

const A =
  '{sec2.other_notification_method}</hp:t></hp:run><hp:run charPrIDRef="30"/><hp:linesegarray><hp:lineseg textpos="0" vertpos="1000" vertsize="1000" textheight="1000" baseline="850" spacing="452" horzpos="0" horzsize="41716" flags="393216"/></hp:linesegarray></hp:p>';
const B =
  '<hp:p id="2147483648" paraPrIDRef="32" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="15"/>';

const SIG_PARA = `<hp:p id="2147483648" paraPrIDRef="27" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="1"><hp:pic id="2108353999" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="1034611999" reverse="0"><hp:offset x="0" y="0"/><hp:orgSz width="21600" height="7200"/><hp:curSz width="10800" height="3600"/><hp:flip horizontal="0" vertical="0"/><hp:rotationInfo angle="0" centerX="5400" centerY="1800" rotateimage="1"/><hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="0.5" e2="0" e3="0" e4="0" e5="0.5" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo><hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="21600" y="0"/><hc:pt2 x="21600" y="7200"/><hc:pt3 x="0" y="7200"/></hp:imgRect><hp:imgClip left="0" right="19840" top="0" bottom="6600"/><hp:inMargin left="0" right="0" top="0" bottom="0"/><hp:imgDim dimwidth="19840" dimheight="6600"/><hc:img binaryItemIDRef="image1" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects/><hp:sz width="10800" widthRelTo="ABSOLUTE" height="3600" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:shapeComment>signature</hp:shapeComment></hp:pic></hp:run><hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="3600" textheight="3600" baseline="3060" spacing="452" horzpos="0" horzsize="41716" flags="393216"/></hp:linesegarray></hp:p>`;

const needle = `${A}${B}`;
if (!xml.includes(needle)) {
  throw new Error('Unique A+B sequence in notification cell not found');
}
xml = xml.replace(needle, `${A}${SIG_PARA}${B}`);

zip.file('Contents/section0.xml', xml);
const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
const tmpPath = `${hwpxPath}.new`;
try {
  fs.writeFileSync(hwpxPath, out);
  console.log('Patched', hwpxPath);
} catch (error) {
  if (error && (error.code === 'EBUSY' || error.code === 'EPERM')) {
    fs.writeFileSync(tmpPath, out);
    console.warn('Original file is locked; wrote', tmpPath, '— close Hancom/IDE and replace the .hwpx manually.');
  } else {
    throw error;
  }
}
