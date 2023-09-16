class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryStr = JSON.parse(queryStr);
    this.query = this.query.find(queryStr);
    //console.log('i came here');
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    //console.log('i came here');
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    //console.log('i came here');
    return this;
  }

  paginate() {
    if (this.queryString.page) {
      //console.log('i came here');
      let skipped = this.queryString.page * 1 - 1;
      let pageLimit = this.queryString.limit * 1 || 1000;
      skipped *= pageLimit;
      this.query = this.query.skip(skipped).limit(pageLimit);
      //console.log('i came here');
    } else {
      let pageLimit = this.queryString.limit * 1 || 1000;
      this.query = this.query.skip(0).limit(pageLimit);
    }
    return this;
  }
}

module.exports = APIFeatures;
