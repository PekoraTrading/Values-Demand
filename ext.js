(async function () {
  console.log("✅ Pekora Trade Enhancer loaded (fixed selectors)");

  const res = await fetch("https://raw.githubusercontent.com/PekoraTrading/Values-Demand/main/Collectibles.json");
  const data = await res.json();
  const valueMap = new Map(data.map(item => [cleanName(item.Name), item.Value]));
  console.log("✅ Loaded", valueMap.size, "values");

  const style = document.createElement('style');
  style.textContent = `
  @keyframes shine {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .animated-rare {
    position: relative;
    font-weight: bold;
    margin-top: -4px;
    font-size: 13px;
    color: transparent;
    background: linear-gradient(90deg, #007d8c, #00ffff, #007d8c);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 2s linear infinite;
  }
  
  .animated-rare::before {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    color: black;
    z-index: -1;
    text-shadow: 1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black;
  }
  `;
  document.head.appendChild(style);  

  function cleanName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase();
  }

  function getValue(name) {
    return valueMap.get(cleanName(name)) || 0;
  }

  function formatNumber(num) {
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }

  function detectSharker() {
    const usernameElem = document.querySelector('a.aLink-0-2-129[href*="/User.aspx"]');
    if (!usernameElem) return;
  
    const username = usernameElem.textContent.trim().toLowerCase();
  
    fetch("https://raw.githubusercontent.com/PekoraTrading/Values-Demand/refs/heads/main/Sharks")
      .then(res => res.text())
      .then(text => {
        let sharkList;
        try {
          sharkList = JSON.parse(text);
        } catch (e) {
          throw new Error("❌ JSON parse error: " + e.message);
        }
    
        const isSharker = sharkList.some(entry => entry.Username?.toLowerCase() === username);  
  
        if (!isSharker) {
          return;
        }
  
        const giveHeader = Array.from(document.querySelectorAll('p.fw-700.font-size-15'))
          .find(p => p.textContent.includes("ITEMS YOU WILL GIVE"));
        
        if (!giveHeader) return;
  
        const warning = document.createElement('p');
        warning.textContent = "⚠ THIS PLAYER IS A KNOWN SHARKER ⚠";
        warning.style.color = '#CCCC00'; 
        warning.style.fontWeight = 'bold';
        warning.style.marginTop = '-10px';
        warning.style.fontSize = '12px';
  
        
        warning.title = "A 'sharker' is someone who baits other players into thinking they're making a good trade, but in reality, the trade is a bad deal for one of the players involved.";
  
        warning.style.cursor = 'pointer'; 
        
        giveHeader.insertAdjacentElement('afterend', warning);  
        
        warning.addEventListener('mouseover', () => {
          warning.style.color = '#CC3333';  
        });
  
        warning.addEventListener('mouseout', () => {
          warning.style.color = '#CCCC00';  
        });
      })
      .catch(err => {});
  }  

  function injectValues(sectionElement) {
    const itemBoxes = sectionElement.querySelectorAll('.col-0-2-135');
    let total = 0;

    itemBoxes.forEach(box => {
      const nameElem = box.querySelector('.itemName-0-2-137 a');
      if (!nameElem) return;

      const itemName = nameElem.textContent.trim();
      const cleanedItemName = cleanName(itemName);
      const val = getValue(itemName);
      
      total += val;  
      

      if (!box.querySelector('.custom-value-tag')) {
        const valTag = document.createElement('div');
        valTag.className = 'custom-value-tag';
        valTag.style.fontSize = '12px';
        valTag.style.textAlign = 'center';
        valTag.style.fontWeight = 'bold';
        const displayValue = (val === 0) ? "N/A" : formatNumber(val);
  
        valTag.textContent = `Value: ${displayValue}`;
        valTag.style.marginTop = '-8px'; 
        valTag.style.whiteSpace = 'nowrap';
        valTag.style.overflow = 'hidden';
        valTag.style.textOverflow = 'ellipsis';
        valTag.style.wordWrap = 'break-word';

        const item = data.find(i => cleanName(i.Name) === cleanedItemName);
        if (item?.IsRare) {
          valTag.classList.add('animated-rare');
        }

        box.appendChild(valTag);

        if (item && item.Demand) {
          const demandTag = document.createElement('div');
          demandTag.style.fontSize = '10px';
          demandTag.style.textAlign = 'center';
          demandTag.style.fontWeight = 'bold';
          demandTag.textContent = `Demand: ${item.Demand}`;
          demandTag.style.marginTop = '-0.5px'; 
          demandTag.style.whiteSpace = 'nowrap';
          demandTag.style.overflow = 'hidden';
          demandTag.style.textOverflow = 'ellipsis';
          demandTag.style.wordWrap = 'break-word';

          
          

          switch (item.Demand.toLowerCase()) {
            case 'very low': demandTag.style.color = '#550000'; break;  
            case 'low': demandTag.style.color = '#CC0000'; break;  
            case 'medium': demandTag.style.color = '#CCCC00'; break;  
            case 'high': demandTag.style.color = '#00CC00'; break;  
            default: demandTag.style.color = '#B0B0B0'; break;  
          }

          box.appendChild(demandTag);
        }
      }
    });

    return total;
  }

  function enhanceCollectiblesPage() {
    if (!location.pathname.includes('/internal/collectibles')) return;
  
    const cards = document.querySelectorAll('.card.bg-dark');
  
    cards.forEach(card => {
      const body = card.querySelector('.card-body');
      if (!body || body.querySelector('.custom-value-tag')) return;
  
      const pTags = body.querySelectorAll('p');
      if (pTags.length < 1) return;
  
      const nameText = pTags[0].textContent.trim();
      const value = getValue(nameText);
      if (!value) return;
  
      const valueElem = document.createElement('p');
      valueElem.className = 'mb-0 text-truncate custom-value-tag';
      valueElem.style.color = '#00e676';
      valueElem.style.fontWeight = 'bold';
      valueElem.textContent = `Value: ${formatNumber(value)}`;
      pTags[pTags.length - 1].insertAdjacentElement('afterend', valueElem);
  
      const totalRAPElem = document.querySelector('p.fw-bolder');
      if (totalRAPElem && !document.querySelector('#total-value-display')) {
        let totalValue = 0;
        const cards = document.querySelectorAll('.card.bg-dark');
        cards.forEach(card => {
          const nameElem = card.querySelector('.card-body p.fw-bolder');
          if (!nameElem) return;
          const itemName = nameElem.textContent.trim();
          const val = getValue(itemName);
          if (val) totalValue += val;
        });
  
        const totalValueElem = document.createElement('p');
        totalValueElem.id = 'total-value-display';
        totalValueElem.className = 'fw-bolder';
        totalValueElem.style.color = '#00e676';
        totalValueElem.style.marginTop = '-16.5px';
        totalValueElem.textContent = `Total Value: ${formatNumber(totalValue)}`;
        totalRAPElem.insertAdjacentElement('afterend', totalValueElem);
      }
    });
  }  

  function enhanceTrade() {
    const tradeModal = document.querySelector('.col-9');
    if (!tradeModal) return;
  
    tradeModal.style.position = 'relative';
  
    const sections = tradeModal.querySelectorAll('.row.ms-1.mb-4');
    if (sections.length < 2) return;
  
    const givesTotal = injectValues(sections[0]);
    const receivesTotal = injectValues(sections[1]);
  
    const robuxLabels = tradeModal.querySelectorAll('.robuxLabel-0-2-133');
    const valueLabels = tradeModal.querySelectorAll('.valueLabel-0-2-131');
    valueLabels.forEach(label => {
      label.textContent = 'RAP:'; 
    });
  
    if (robuxLabels.length >= 2) {
  
      const givesRobux = parseInt(robuxLabels[0].textContent.replace(/[^0-9]/g, '')) || 0;
      const receivesRobux = parseInt(robuxLabels[1].textContent.replace(/[^0-9]/g, '')) || 0;
  
      const overpayRAP = receivesRobux - givesRobux;
      const overpayValue = receivesTotal - givesTotal;
  
      const overpayTextRAP = overpayRAP > 0 ? `+${formatNumber(overpayRAP)}` : formatNumber(overpayRAP);
      const overpayTextValue = overpayValue > 0 ? `+${formatNumber(overpayValue)}` : formatNumber(overpayValue);
  
      const overpayContainerRAP = document.createElement('div');
      overpayContainerRAP.style.position = 'absolute';
      overpayContainerRAP.style.left = '-162px';
      overpayContainerRAP.style.bottom = '30px';
      overpayContainerRAP.style.fontSize = '20px';
      overpayContainerRAP.style.fontWeight = 'bold';
      overpayContainerRAP.textContent = `RAP: ${overpayRAP === 0 ? '=' : overpayTextRAP}`;
      overpayContainerRAP.style.color = overpayRAP === 0 ? 'gray' : (overpayRAP > 0 ? '#39FF14' : '#FF3131');
      overpayContainerRAP.style.textShadow = '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black';
      
      const overpayContainerValue = document.createElement('div');
      overpayContainerValue.style.position = 'absolute';
      overpayContainerValue.style.left = '-162px';
      overpayContainerValue.style.bottom = '0px';
      overpayContainerValue.style.fontSize = '20px';
      overpayContainerValue.style.fontWeight = 'bold';
      overpayContainerValue.textContent = `Value: ${overpayValue === 0 ? '=' : overpayTextValue}`;
      overpayContainerValue.style.color = overpayValue === 0 ? 'gray' : (overpayValue > 0 ? '#39FF14' : '#FF3131');
      overpayContainerValue.style.textShadow = '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black';        
      
      const icon = document.createElement('img');
      icon.src = "https://www.pekora.zip/images/thumbnails/1d1dbf7959ffe6f8a0519362224b17454c8c61568ca4f8725ec4f37e00b3cf65.png";
      icon.style.width = '16px';
      icon.style.marginRight = '5px';
  
      
      const totalValueContainer = document.createElement('div');
      totalValueContainer.style.display = 'flex';
      totalValueContainer.style.justifyContent = 'center';
      totalValueContainer.style.alignItems = 'center';
      totalValueContainer.style.marginTop = '3px';
  
      const valueText = document.createElement('span');
      valueText.textContent = `Value: ${formatNumber(givesTotal)}`;
      valueText.style.fontSize = '12px';
      valueText.style.fontWeight = 'bold'; 
  
      totalValueContainer.appendChild(icon);
      totalValueContainer.appendChild(valueText);
      robuxLabels[0].parentElement.appendChild(totalValueContainer);
  
      
      const totalValueContainerReceives = document.createElement('div');
      totalValueContainerReceives.style.display = 'flex';
      totalValueContainerReceives.style.justifyContent = 'center';
      totalValueContainerReceives.style.alignItems = 'center';
      totalValueContainerReceives.style.marginTop = '3px';
  
      const iconReceives = document.createElement('img');
      iconReceives.src = "https://www.pekora.zip/images/thumbnails/1d1dbf7959ffe6f8a0519362224b17454c8c61568ca4f8725ec4f37e00b3cf65.png";
      iconReceives.style.width = '16px';
      iconReceives.style.marginRight = '5px';
  
      const valueTextReceives = document.createElement('span');
      valueTextReceives.textContent = `Value: ${formatNumber(receivesTotal)}`;
      valueTextReceives.style.fontSize = '12px';
      valueTextReceives.style.fontWeight = 'bold'; 
  
      totalValueContainerReceives.appendChild(iconReceives);
      totalValueContainerReceives.appendChild(valueTextReceives);
      robuxLabels[1].parentElement.appendChild(totalValueContainerReceives);
  
      
      tradeModal.appendChild(overpayContainerRAP);
      tradeModal.appendChild(overpayContainerValue);

      detectSharker();
    }
  }  

  function enhanceCatalogPage() {
    if (!location.pathname.startsWith('/catalog/')) return;
  
    let tries = 0;
    const interval = setInterval(() => {
      
      const titleElem = document.querySelector('h1.title-0-2-95');
      const wrapper = document.querySelector('.wrapper-0-2-141');
  
      if (!titleElem || !wrapper) {
        if (++tries > 10) clearInterval(interval);
        return;
      }
  
      const itemName = titleElem.textContent.trim();
      const cleanedName = cleanName(itemName);
      const itemValue = getValue(cleanedName);
  
      if (!itemValue || wrapper.querySelector('.custom-value-tag')) {
        clearInterval(interval);
        return;
      }
  
      
      const valueElem = document.createElement('p');
      valueElem.className = 'text-center custom-value-tag';
      valueElem.style.color = '#00e676';
      valueElem.style.fontWeight = 'bold';
      valueElem.style.marginTop = '10px';
      valueElem.style.fontSize = '24px';
      valueElem.textContent = `Value: ${formatNumber(itemValue)}`;
      valueElem.style.webkitTextStroke = '0.5px black';  
      valueElem.style.textStroke = '0.5px black';  
      wrapper.appendChild(valueElem);
  
      
      const item = data.find(i => cleanName(i.Name) === cleanedName);
      if (item?.Demand) {
        const demandElem = document.createElement('p');
        demandElem.className = 'text-center custom-value-tag';
        demandElem.style.fontWeight = 'bold';
        demandElem.style.marginTop = '-5px';
        demandElem.style.fontSize = '22px';
        demandElem.textContent = `Demand: ${item.Demand}`;

        demandElem.style.webkitTextStroke = '0.5px black';  
        demandElem.style.textStroke = '0.5px black';  
  
        switch (item.Demand.toLowerCase()) {
          case 'very low': demandElem.style.color = '#8B0000'; break;
          case 'low': demandElem.style.color = '#FF0000'; break;
          case 'medium': demandElem.style.color = '#FFFF00'; break;
          case 'high': demandElem.style.color = '#00FF00'; break;
          default: demandElem.style.color = '#FFFFFF'; break;
        }
  
        wrapper.appendChild(demandElem);
      }

      if (item?.IsRare === true) {
        const rareElem = document.createElement('p');
        rareElem.className = 'text-center custom-value-tag animated-rare';
        rareElem.style.fontWeight = 'bold';
        rareElem.style.marginTop = '-4px';
        rareElem.style.fontSize = '20px';
        rareElem.textContent = 'Rare Item';
      
        wrapper.appendChild(rareElem);
      }
  
      clearInterval(interval); 
    }, 300);
  } 
  
  let tradeValues = { offer: 0, request: 0 };
  let rapValues = { offer: 0, request: 0 };
  let overpayTextElements = { rap: null, value: null };
  
  function enhanceTradeWindowValues() {
    const tradingHeader = document.querySelector('span.font-size-18.fw-700');

    if (tradingHeader && !document.querySelector('.custom-trade-warning')) {
        const warning = document.createElement('div');
        warning.className = 'custom-trade-warning';
        warning.style.color = 'red';
        warning.style.fontSize = '14px';
        warning.style.fontWeight = 'bold';
        warning.style.marginTop = '10px';
        warning.textContent = "⚠️ Do not remove the items from the offer by clicking on them from the boxes on the left. It will break the total values in the offer and you might get confused, rather just click the 'Remove' Button under the item.";

        tradingHeader.parentElement.appendChild(warning);
    }

    updateRAPValues();

    const itemBoxes = document.querySelectorAll('.itemColEntry-0-2-100');
    
    itemBoxes.forEach(box => {
        const nameElem = box.querySelector('.itemNameOpen-0-2-107 a');
        if (!nameElem) return;

        const itemName = nameElem.textContent.trim();
        const val = getValue(itemName);

        const rapElement = box.querySelector('span.amount-0-2-94');
        const rap = rapElement ? parseFloat(rapElement.textContent.trim()) : 0;

        if (!val) return;

        if (!box.querySelector('.custom-value-tag')) {
            const valueTag = document.createElement('p');
            valueTag.className = 'custom-value-tag statEntry-0-2-108';
            valueTag.style.color = '#00e676';
            valueTag.style.fontWeight = 'bold';
            valueTag.textContent = `Value: ${formatNumber(val)}`;
            box.querySelector('.itemCard-0-2-101')?.appendChild(valueTag);
        }

        const button = box.querySelector('button.requestButton-0-2-98');
        if (button && !button.dataset.listener) {
            button.dataset.listener = 'true';

            button.addEventListener('click', () => {
                const isRemove = button.textContent.trim() === 'Remove';
                const colParent = box.closest('.col-4, .col-8, .col-12');
                if (!colParent) return;

                const isYourOffer = colParent.closest('.row')?.querySelector('h3').textContent.includes("My Inventory");
                const isPartnerRequest = colParent.closest('.row')?.querySelector('h3').textContent.includes("Partner's Inventory");

                let offerIndex = null;
                if (isYourOffer) {
                    offerIndex = 'offer';
                } else if (isPartnerRequest) {
                    offerIndex = 'request';
                }

                if (offerIndex === null) return;

                if (isRemove) {
                    tradeValues[offerIndex] -= val;
                    rapValues[offerIndex] -= rap;
                } else {
                    tradeValues[offerIndex] += val;
                    rapValues[offerIndex] += rap;
                }

                updateTotals();
                updateOverpayText();
            });
        }
    });

    updateTotals();
    updateOverpayText();
}

function updateRAPValues() {
  const yourOfferSection = Array.from(document.querySelectorAll('.row .col-6 h3')).find(h3 => h3.textContent.includes("Your Offer"));

  const partnerRequestSection = Array.from(document.querySelectorAll('.row .col-6 h3')).find(h3 => h3.textContent.includes("Your Request"));

  if (yourOfferSection) {
      const yourOfferRAP = yourOfferSection.closest('.row').querySelector('.valueText-0-2-91 .amount-0-2-94');
      if (yourOfferRAP) {
          rapValues.offer = parseFloat(yourOfferRAP.textContent.trim()) || 0;
      }
  }

  if (partnerRequestSection) {
      const partnerRequestRAP = partnerRequestSection.closest('.row').querySelector('.valueText-0-2-91 .amount-0-2-94');
      if (partnerRequestRAP) {
          rapValues.request = parseFloat(partnerRequestRAP.textContent.trim()) || 0;
      }
  }
}
  
  function updateTotals() {
      const valueSpans = document.querySelectorAll('.valueText-0-2-91');
  
      valueSpans.forEach((span, idx) => {
          let wrapper = span.parentElement.querySelector('.custom-total-value-wrapper');
          if (!wrapper) {
              wrapper = document.createElement('div');
              wrapper.className = 'custom-total-value-wrapper';
              wrapper.style.display = 'flex';
              wrapper.style.alignItems = 'center';
              wrapper.style.marginTop = '15px';
              wrapper.style.gap = '5px';
              wrapper.style.marginLeft = '45px';
  
              const icon = document.createElement('img');
              icon.src = "https://www.pekora.zip/images/thumbnails/1d1dbf7959ffe6f8a0519362224b17454c8c61568ca4f8725ec4f37e00b3cf65.png";
              icon.style.width = '16px';
              icon.style.marginRight = '0.5px';
  
              const valueText = document.createElement('span');
              valueText.className = 'custom-total-value';
              valueText.style.fontSize = '12px';
              valueText.style.fontWeight = 'bold';
              valueText.style.whiteSpace = 'nowrap';
              valueText.textContent = `Value: ${formatNumber(tradeValues[idx === 0 ? 'offer' : 'request'])}`;
  
              wrapper.appendChild(icon);
              wrapper.appendChild(valueText);
              span.parentElement.appendChild(wrapper);
          } else {
              const valueText = wrapper.querySelector('.custom-total-value');
              valueText.textContent = `Value: ${formatNumber(tradeValues[idx === 0 ? 'offer' : 'request'])}`;
          }
      });
  }
  
  function updateOverpayText() {
    const overpayRAP = rapValues.request - rapValues.offer;
    const overpayValue = tradeValues.request - tradeValues.offer;

    const overpayTextRAP = overpayRAP > 0 ? `+${formatNumber(overpayRAP)}` : formatNumber(overpayRAP);
    const overpayTextValue = overpayValue > 0 ? `+${formatNumber(overpayValue)}` : formatNumber(overpayValue);

    let overpayContainerRAP = document.querySelector('.overpay-text-rap');
    let overpayContainerValue = document.querySelector('.overpay-text-value');

    if (!overpayContainerRAP) {
        overpayContainerRAP = document.createElement('div');
        overpayContainerRAP.className = 'overpay-text-rap';
        overpayContainerRAP.style.fontSize = '20px';
        overpayContainerRAP.style.fontWeight = 'bold';
        overpayContainerRAP.style.color = overpayRAP === 0 ? '#808080' : (overpayRAP > 0 ? '#39FF14' : '#FF3131');
        overpayContainerRAP.style.textAlign = 'center';
        overpayContainerRAP.style.textShadow = '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black';
        overpayContainerRAP.textContent = `RAP: ${overpayTextRAP}`;

        const rowElement = document.querySelector('.row.mt-4.mb-4');
        if (rowElement) {
            const colElement = rowElement.querySelector('.col-12');
            if (colElement) {
                const divider = colElement.querySelector('.divider-top');
                if (divider) {
                    colElement.insertBefore(overpayContainerRAP, divider);
                }
            }
        }
    } else {
      overpayContainerRAP.style.color = overpayRAP === 0 ? '#808080' : (overpayRAP > 0 ? '#39FF14' : '#FF3131');
      overpayContainerRAP.textContent = `RAP: ${overpayRAP === 0 ? '=' : overpayTextRAP}`;
    }

    if (!overpayContainerValue) {
        overpayContainerValue = document.createElement('div');
        overpayContainerValue.className = 'overpay-text-value';
        overpayContainerValue.style.fontSize = '20px';
        overpayContainerValue.style.fontWeight = 'bold';
        overpayContainerValue.style.color = overpayValue === 0 ? '#808080' : (overpayValue > 0 ? '#39FF14' : '#FF3131');
        overpayContainerValue.style.textAlign = 'center';
        overpayContainerValue.style.textShadow = '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black';
        overpayContainerValue.textContent = `Value: ${overpayValue === 0 ? '=' : overpayTextValue}`;

        const rowElement = document.querySelector('.row.mt-4.mb-4');
        if (rowElement) {
            const colElement = rowElement.querySelector('.col-12');
            if (colElement) {
                const divider = colElement.querySelector('.divider-top');
                if (divider) {
                    colElement.insertBefore(overpayContainerValue, divider);
                }
            }
        }
    } else {
        overpayContainerValue.style.color = overpayValue === 0 ? '#808080' : (overpayValue > 0 ? '#39FF14' : '#FF3131');
        overpayContainerValue.textContent = `Value: ${overpayValue === 0 ? '=' : overpayTextValue}`;
    }
}
  
  function hookTradeClicks() {
    const detailsPs = Array.from(document.querySelectorAll("p"))
    .filter(el => el.textContent.trim().toLowerCase() === "view details" && !el.dataset.listenerAttached);

    detailsPs.forEach((el, i) => {
      el.dataset.listenerAttached = "true";
      el.addEventListener("click", () => {
        let tries = 0;
        const interval = setInterval(() => {
          const modal = document.querySelector('.col-9');
          if (modal) {
            clearInterval(interval);
            enhanceTrade();
          } else if (++tries > 20) {
            clearInterval(interval);
          }
        }, 300);
      });
    });
  }

  function addRainbowEffect(element) {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes rainbow-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .rainbow-text {
        background: linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3);
        background-size: 300% 300%;
        color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
        animation: rainbow-gradient 3s linear infinite;
      }
    `;
    document.head.appendChild(style);
    element.classList.add('rainbow-text');
  }
  
  function addPinkEffect(element) {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pink-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .pink-text {
        background: linear-gradient(90deg, #ffb6c1, #ff69b4, #db3e75);
        background-size: 300% 300%;
        color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
        animation: pink-gradient 4s ease infinite;
      }
    `;
    document.head.appendChild(style);
    element.classList.add('pink-text');
  }
  
  function checkAndEnhanceProfilePage() {
    const userIdFromUrl = window.location.pathname.split('/')[2];
    const usernameElement = document.querySelector('.username-0-2-102');
  
    fetch('https://raw.githubusercontent.com/PekoraTrading/Values-Demand/main/users')
      .then(res => res.json())
      .then(data => {
        const userEntry = data.users.find(user => user.id === userIdFromUrl);
        if (usernameElement && userEntry) {
          if (userEntry.effect === 'rainbow') {
            addRainbowEffect(usernameElement);
          } else if (userEntry.effect === 'pink') {
            addPinkEffect(usernameElement);
          }
        }
      });
  }  

  function checkAndEnhancePage() {
    const url = location.href;
  
    if (location.pathname.toLowerCase().includes('/internal/collectibles')) {
      enhanceCollectiblesPage();
    } else if (location.pathname.toLowerCase().startsWith('/catalog/')) {
      enhanceCatalogPage();
    } else if (location.pathname.toLowerCase().startsWith('/trade/')) {
      enhanceTradeWindowValues();
    }

    checkAndEnhanceProfilePage();
  } 


  function delayCheckAndEnhancePage() {
    setTimeout(() => {
      setTimeout(500);
      checkAndEnhancePage();
    }, 1000);
  }
  
  delayCheckAndEnhancePage();
  
  const observer = new MutationObserver(() => {
    hookTradeClicks();
    delayCheckAndEnhancePage();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  window.addEventListener('popstate', () => {
    delayCheckAndEnhancePage();
  });
  
  window.addEventListener('hashchange', () => {
    delayCheckAndEnhancePage();
  });
  
  window.addEventListener('load', () => {
    delayCheckAndEnhancePage();
  }); 

  let lastUrl = location.href;

setInterval(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    location.reload();
  }
}, 50);
})();
