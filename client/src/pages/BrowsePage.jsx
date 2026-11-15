import { useEffect, useState } from 'react'
import { ArrowDownUp, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { ProductGrid, ProductSkeletons } from '../components/ProductGrid'
import { getProducts } from '../services/api'

const categories = ['All finds', 'Electronics', 'Mobiles', 'Laptops', 'Fashion', 'Furniture', 'Home Appliances', 'Books', 'Sports', 'Vehicles', 'Gaming', 'Accessories', 'Other']

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || '')
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '')
  const [pageData, setPageData] = useState({ page: 1, pages: 1, total: 0 })
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const location = searchParams.get('location') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = searchParams.get('page') || '1'

  useEffect(() => {
    let active = true
    getProducts({ limit: 24, category, search, location, sort, minPrice, maxPrice, condition, page })
      .then((response) => {
        if (active) {
          setProducts(response.data)
          setPageData(response.pagination)
          setError('')
        }
      })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load products. Check that the API and MongoDB are running.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category, search, location, sort, minPrice, maxPrice, condition, page, reload])

  function updateParam(key, value) {
    setLoading(true)
    setError('')
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.set('page', '1')
    setSearchParams(next)
  }

  function applyFilters(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries({ minPrice, maxPrice, condition, location: locationFilter })) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  return (
    <>
      <Navbar />
      <main className="browse-page page-gutter">
        <div className="breadcrumb"><span>Home</span><span>/</span><b>Explore</b></div>
        <div className="browse-heading">
          <div><span className="eyebrow">THE GOOD STUFF, ALL IN ONE PLACE</span><h1>{search ? `Looking for “${search}”` : location ? `Finds near ${location}` : category || 'Explore all finds'}</h1><p>Pre-loved pieces with plenty of life left in them.</p></div>
          <label className="sort-select"><ArrowDownUp size={15} /><span>Sort by</span><select value={sort} onChange={(event) => updateParam('sort', event.target.value)} aria-label="Sort products"><option value="newest">Newest first</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        </div>
        <div className="browse-categories"><SlidersHorizontal size={16} /><span>Browse:</span>{categories.map((name) => {
          const value = name === 'All finds' ? '' : name
          return <button className={category === value ? 'active' : ''} type="button" onClick={() => updateParam('category', value)} key={name}>{name}</button>
        })}</div>
        <form className="browse-filter-form" onSubmit={applyFilters}>
          <label>Min price <span>₹</span><input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Any" /></label>
          <label>Max price <span>₹</span><input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Any" /></label>
          <label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value)}><option value="">All conditions</option>{['Like New', 'Excellent', 'Good', 'Fair'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Location<input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="City or neighborhood" /></label>
          <button type="submit">Apply filters</button>
        </form>
        <div className="browse-count">{loading ? 'Finding lovely things…' : `${pageData.total} ${pageData.total === 1 ? 'find' : 'finds'} to explore`}</div>
        {loading && <ProductSkeletons count={8} />}
        {error && !loading && <div className="inline-error">{error}<button type="button" onClick={() => { setLoading(true); setError(''); setReload((current) => current + 1) }}>Try again</button></div>}
        {!loading && !error && <ProductGrid products={products} />}
        {!loading && !error && pageData.pages > 1 && <div className="pagination-controls"><button type="button" disabled={pageData.page <= 1} onClick={() => updateParam('page', String(pageData.page - 1))}><ChevronLeft size={15} /> Previous</button><span>Page {pageData.page} of {pageData.pages}</span><button type="button" disabled={pageData.page >= pageData.pages} onClick={() => updateParam('page', String(pageData.page + 1))}>Next <ChevronRight size={15} /></button></div>}
      </main>
      <Footer />
    </>
  )
}
