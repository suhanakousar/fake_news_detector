"""
HTML Scraper for extracting article text from URLs
Fixed version from fakenews-main
"""
import newspaper
from datetime import datetime

def dateify(date):
    """Convert date string to MM-DD-YYYY format"""
    if not date:
        return ""
    try:
        date_string = str(date)[0:10]
        date_object = datetime.strptime(date_string, "%Y-%m-%d")
        new_date_string = date_object.strftime("%m-%d-%Y")
        return new_date_string
    except:
        return str(date)

def html_scraper(url):
    """
    Scrape article text from URL using newspaper3k
    Returns the article text, or the original input if it's not a valid URL
    """
    if len(url.split(" ")) != 1:
        return url  # Not a URL, return as-is

    try:
        article = newspaper.Article(url=url, language='en')
        article.download()
        article.parse()
        
        return str(article.text) if article.text else url
    except Exception as e:
        # If scraping fails, return the URL as-is
        print(f"Error scraping URL {url}: {e}")
        return url

def add_to_CSV(url, classification):
    """
    Add article to CSV file (for feedback collection)
    Fixed version with proper function call
    """
    if len(url.split(" ")) != 1:
        return  # Not a URL

    try:
        article = newspaper.Article(url=url, language='en')
        article.download()
        article.parse()
        
        article_data = {
            "title": str(article.title) if article.title else "",
            "text": str(article.text) if article.text else "",
            "authors": article.authors,
            "published_date": str(article.publish_date) if article.publish_date else "",
            "top_image": str(article.top_image) if article.top_image else "",
            "videos": article.movies,
            "keywords": article.keywords,
            "summary": str(article.summary) if article.summary else ""
        }
        
        # Fix: Use function call instead of bracket notation
        formatted_date = dateify(article_data['published_date'])
        new_row = [article_data['title'], article_data['text'], classification, formatted_date]

        import csv
        with open('new_data.csv', 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(new_row)
    except Exception as e:
        print(f"Error adding to CSV: {e}")

