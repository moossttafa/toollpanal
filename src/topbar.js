import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Navbar,
  Alignment,
  AnchorButton,
  Divider,
  Dialog,
  Classes,
  Position,
  Menu,
  HTMLSelect,
  Slider,
} from '@blueprintjs/core';
import FaGithub from '@meronex/icons/fa/FaGithub';
import FaDiscord from '@meronex/icons/fa/FaDiscord';
import BiCodeBlock from '@meronex/icons/bi/BiCodeBlock';
import { downloadFile } from 'polotno/utils/download';
import { Popover2 } from '@blueprintjs/popover2';
import * as unit from 'polotno/utils/unit';
import { t } from 'polotno/utils/l10n';

import styled from 'polotno/utils/styled';

const NavbarContainer = styled('div')`
  @media screen and (max-width: 500px) {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100vw;
  }
`;

const NavInner = styled('div')`
  @media screen and (max-width: 500px) {
    display: flex;
  }
`;

const DownloadButton = observer(({ store }) => {
  const [saving, setSaving] = React.useState(false);
  const [quality, setQuality] = React.useState(1);
  const [type, setType] = React.useState('png');

  const getName = () => {
    const texts = [];
    store.pages.forEach((p) => {
      p.children.forEach((c) => {
        if (c.type === 'text') {
          texts.push(c.text);
        }
      });
    });
    const allWords = texts.join(' ').split(' ');
    const words = allWords.slice(0, 6);
    return words.join(' ').replace(/\s/g, '-').toLowerCase() || 'polotno';
  };
  return (
    <Popover2
      content={
        <Menu>
          <li class="bp4-menu-header">
            <h6 class="bp4-heading">File type</h6>
          </li>
          <HTMLSelect
            fill
            onChange={(e) => {
              setType(e.target.value);
              setQuality(1);
            }}
            value={type}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="pdf">PDF</option>
          </HTMLSelect>
          <li class="bp4-menu-header">
            <h6 class="bp4-heading">Size</h6>
          </li>
          <div style={{ padding: '10px' }}>
            <Slider
              value={quality}
              labelRenderer={false}
              // labelStepSize={0.4}
              onChange={(quality) => {
                setQuality(quality);
              }}
              stepSize={0.2}
              min={0.2}
              max={3}
              showTrackFill={false}
            />
            {type === 'pdf' && (
              <div>
                {unit.pxToUnitRounded({
                  px: store.width,
                  dpi: store.dpi / quality,
                  precious: 0,
                  unit: 'mm',
                })}{' '}
                x{' '}
                {unit.pxToUnitRounded({
                  px: store.height,
                  dpi: store.dpi / quality,
                  precious: 0,
                  unit: 'mm',
                })}{' '}
                mm
              </div>
            )}
            {type !== 'pdf' && (
              <div>
                {Math.round(store.width * quality)} x{' '}
                {Math.round(store.height * quality)} px
              </div>
            )}
          </div>
          <Button
            fill
            intent="primary"
            loading={saving}
            onClick={async () => {
              if (type === 'pdf') {
                setSaving(true);
                await store.saveAsPDF({
                  fileName: getName() + '.pdf',
                  dpi: store.dpi / quality,
                  pixelRatio: 2 * quality,
                });
                setSaving(false);
              } else {
                store.pages.forEach((page, index) => {
                  // do not add index if we have just one page
                  const indexString =
                    store.pages.length > 1 ? '-' + (index + 1) : '';
                  store.saveAsImage({
                    pageId: page.id,
                    pixelRatio: quality,
                    mimeType: 'image/' + type,
                    fileName: getName() + indexString + '.' + type,
                  });
                });
              }
            }}
          >
            Download {type.toUpperCase()}
          </Button> 
        </Menu>
      }
      position={Position.BOTTOM_RIGHT}
    >
      <Button
        icon="import"
        text={t('toolbar.download')}
        intent="primary"
        loading={saving}
        onClick={() => {
          setQuality(1);
        }}
      />
    </Popover2>
  );
});

export default observer(({ store }) => {
  const inputRef = React.useRef();

  const [faqOpened, toggleFaq] = React.useState(false);
  const [questionOpened, toggleQuestion] = React.useState(false);

  return (
    <NavbarContainer className="sidebar">
      <NavInner>
        <Navbar.Group align={Alignment.LEFT}>
          <Button
            className='topbar__left'
            icon="new-object" 
            style={{color: "#3A7AFE"}}
            minimal
            onClick={() => {
              const ids = store.pages
                .map((page) => page.children.map((child) => child.id))
                .flat();
              const hasObjects = ids?.length;
              if (hasObjects) {
                if (!window.confirm('Remove all content for a new design?')) {
                  return;
                }
              }
              const pagesIds = store.pages.map((p) => p.id);
              store.deletePages(pagesIds);
              store.addPage();
            }}
          >
          <span className="second-color">
            New
          </span>
          </Button>
          <label htmlFor="load-project">
            <Button
              icon="folder-open"
              minimal
              onClick={() => {
                document.querySelector('#load-project').click();
              }}
            >
              Open
            </Button>
            <input
              type="file"
              id="load-project"
              accept=".json,.polotno"
              ref={inputRef}
              style={{ width: '180px', display: 'none' }}
              onChange={(e) => {
                var input = e.target;

                if (!input.files.length) {
                  return;
                }

                var reader = new FileReader();
                reader.onloadend = function () {
                  var text = reader.result;
                  let json;
                  try {
                    json = JSON.parse(text);
                  } catch (e) {
                    alert('Can not load the project.');
                  }

                  if (json) {
                    store.loadJSON(json);
                    input.value = '';
                  }
                };
                reader.onerror = function () {
                  alert('Can not load the project.');
                };
                reader.readAsText(input.files[0]);
              }}
            />
          </label>
          <Button
            icon="floppy-disk"
            minimal
            onClick={() => {
              const json = store.toJSON();

              const url =
                'data:text/json;base64,' +
                window.btoa(unescape(encodeURIComponent(JSON.stringify(json))));

              downloadFile(url, 'polotno.json');
            }}
          >
            Save
          </Button> 
        </Navbar.Group>

        <Navbar.Group align={Alignment.RIGHT}> 

          <Divider />
          <DownloadButton store={store} /> 
        </Navbar.Group> 
      </NavInner>
    </NavbarContainer>
  );
});