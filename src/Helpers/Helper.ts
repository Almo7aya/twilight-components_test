//TODO::reduce it to 10
salla.event.setMaxListeners(100);

class Helper {
  private debounce_: any;

  toggleElementClassIf(element, classes1, classes2, callback) {
    classes1 = Array.isArray(classes1) ? classes1 : classes1.split(' ');
    classes2 = Array.isArray(classes2) ? classes2 : classes2.split(' ');
    let isClasses1 = callback(element);
    element?.classList.remove(...(isClasses1 ? classes2 : classes1));
    element?.classList.add(...(isClasses1 ? classes1 : classes2));
    return this;
  }

  toggleClassIf(selector, classes1, classes2, callback) {
    document.querySelectorAll(selector).forEach(element => this.toggleElementClassIf(element, classes1, classes2, callback));
    return this;
  }

  isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  filterEmojies(text) {
    var characterFilter = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    return text.replace(characterFilter, "");
  }

  debounce(fn, ...data) {
    if (!this.debounce_) {
      this.debounce_ = salla.helpers.debounce((callback, ...innerData) => callback(...innerData), 500);
    }
    //@ts-ignore
    return this.debounce_(fn, ...data);
  }

  getProductsSource(source) {
    return {
      'brands.single': 'brands',
      'product.index': 'categories',
      'product.index.latest': 'latest',
      'product.index.offers': 'offers',
      'product.index.search': 'search',
      'landing-page': 'landing-page',
      'product.index.tag': 'tags',
      'product.index.sales': 'sales',
      'components.most_sales_products': 'sales',//temporary, delete it after two days from now
    }[source || salla.config.get('page.slug')] || source || 'latest';
  }

  getPageTitleForSource(source){
    
    source= {
      'brands':'common.titles.brands',
      // 'categories':'',
      'latest':'blocks.home.latest_products',
      'offers':'common.titles.discounts',
      // 'search':'',
      // 'landing-page':'',
      // 'tags':'',
      'sales':'common.titles.most_sales',
    }[source];

    return source ? salla.lang.get(source):'';
  }

  getProductsSourceValue(source, sourceValue) {
    const parsedSource = this.getProductsSource(source);

      // Validate if the source value is a valid JSON string
      let parsedSourceValue: any = null;
      if (sourceValue) {
        try {
          parsedSourceValue = JSON.parse(sourceValue);
        } catch (error) {
          console.error('Invalid JSON string in sourceValue:', error);
        }
      }

    // Handle different source types
    if (!['search', 'json', 'offers', 'latest', 'sales', 'related'].includes(parsedSource)) {

      if (Array.isArray(parsedSourceValue) && parsedSourceValue.length) {
        return parsedSourceValue;
      }
      
      if (Array.isArray(parsedSourceValue) && !parsedSourceValue.length){
        return '';
      }

      if (typeof parsedSourceValue === 'number') {
        return [parsedSourceValue];
      }

      if (!sourceValue && ['categories', 'tags', 'brands'].includes(source)) {
        return [salla.config.get('page.id')];
      }
    }

    // Return sourceValue if it exists and is a valid JSON object/array
    if (parsedSourceValue || sourceValue) {
      return parsedSourceValue || sourceValue;
    }

    if (parsedSource === 'search') {
      return new URLSearchParams(window.location.search).get('q') || '';
    }

    // Return page id as default value
    return salla.config.get('page.id');
  }
}

export default new Helper;
