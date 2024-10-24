import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {

  // 創建 Post
  public async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'content'])
    const post = await Post.create(data)
    return response.created(post)
  }

  // 獲取所有 Post
  public async index({ request, view }: HttpContext) {
    const page = request.input('page', 1)
    const posts = await Post.all()
    console.log(page)
    return view.render('posts/index', { posts })
  }

  // 獲取單個 Post
  public async show({ params }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    return post
  }

  // 更新 Post
  public async update({ params, request }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    const data = request.only(['title', 'content'])
    post.merge(data)
    await post.save()
    return post
  }

  // 刪除 Post
  public async destroy({ params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    await post.delete()
    return response.noContent()
  }
}
